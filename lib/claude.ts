import Anthropic from "@anthropic-ai/sdk";
import type { TriageResult } from "./types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function triageTicket(params: {
  title: string;
  description: string;
  deviceType: string;
  os?: string;
}): Promise<TriageResult> {
  const prompt = `You are a senior tech support specialist. Analyze this tech support request and return a JSON triage assessment.

Issue Title: ${params.title}
Device Type: ${params.deviceType}
Operating System: ${params.os || "Not specified"}
Issue Description: ${params.description}

Analyze the issue and respond ONLY with valid JSON in this exact format:
{
  "severity": "remote" | "onsite",
  "summary": "Brief 1-2 sentence summary of the issue",
  "estimated_time": "Estimated resolution time (e.g., '10-15 minutes', '1-2 hours')",
  "suggested_first_steps": ["Step 1", "Step 2", "Step 3"],
  "technician_notes": "Internal technical notes for the technician — include likely root causes, diagnostic steps to take, and anything unusual about the case"
}

Severity guidelines:
- "remote": Software issues, configuration problems, driver issues, basic troubleshooting, password resets, slow performance, virus/malware scan, network config — anything solvable via phone/screen share
- "onsite": Hardware failures, physical damage, no power, need to physically access the device, hardware replacement, home network wiring

Be concise but specific. The technician_notes should be genuinely useful technical guidance.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch =
      content.text.match(/```json\s*([\s\S]*?)\s*```/) ||
      content.text.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
      throw new Error("No JSON found in Claude response");
    }

    const parsed = JSON.parse(jsonMatch[1]);

    // Validate required fields
    if (
      !parsed.severity ||
      !parsed.summary ||
      !parsed.estimated_time ||
      !Array.isArray(parsed.suggested_first_steps) ||
      !parsed.technician_notes
    ) {
      throw new Error("Invalid triage response structure");
    }

    return {
      severity: parsed.severity === "remote" ? "remote" : "onsite",
      summary: String(parsed.summary),
      estimated_time: String(parsed.estimated_time),
      suggested_first_steps: parsed.suggested_first_steps.map(String),
      technician_notes: String(parsed.technician_notes),
    };
  } catch (error) {
    console.error("Claude triage failed, defaulting to onsite:", error);

    // Fallback: default to onsite and notify technician to manually triage
    return {
      severity: "onsite",
      summary: "AI triage unavailable — manual review required.",
      estimated_time: "To be determined",
      suggested_first_steps: [
        "A technician will contact you shortly to discuss the issue.",
        "Please have your device accessible when we call.",
      ],
      technician_notes:
        "⚠️ AI triage failed — please manually assess this ticket. The customer submitted a request but the automated analysis was unavailable.",
    };
  }
}
