import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { triageTicket } from "@/lib/claude";
import { sendMessage } from "@/lib/twilio";
import {
  generateTicketId,
  buildCustomerTicketMessage,
  buildTechnicianTicketMessage,
} from "@/lib/utils";
import type { DeviceType, NotificationChannel } from "@/lib/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://techrescue.app";

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, deviceType, os, notificationPreference } = body;

    if (!title || !description || !deviceType) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, deviceType" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Get customer profile
    const { data: customer } = await admin
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!customer) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const ticketId = generateTicketId();

    // Save ticket with status 'triaging'
    const { error: insertError } = await admin.from("tickets").insert({
      id: ticketId,
      customer_id: user.id,
      title,
      description,
      device_type: deviceType as DeviceType,
      os: os || null,
      status: "triaging",
    });

    if (insertError) {
      console.error("Failed to insert ticket:", insertError);
      return NextResponse.json(
        { error: "Failed to create ticket" },
        { status: 500 }
      );
    }

    // Update customer notification preference if provided
    if (notificationPreference) {
      await admin
        .from("users")
        .update({ notification_preference: notificationPreference })
        .eq("id", user.id);
    }

    // Run AI triage
    const triage = await triageTicket({
      title,
      description,
      deviceType,
      os,
    });

    // Update ticket with triage result
    await admin
      .from("tickets")
      .update({
        status: "submitted",
        severity: triage.severity,
        ai_summary: triage.summary,
        ai_first_steps: triage.suggested_first_steps,
        ai_estimated_time: triage.estimated_time,
        technician_notes: triage.technician_notes,
      })
      .eq("id", ticketId);

    // Determine notification channel
    const channel: NotificationChannel =
      (notificationPreference as NotificationChannel) ||
      customer.notification_preference ||
      "sms";

    // Send customer confirmation
    const customerMessage = buildCustomerTicketMessage({
      name: customer.name || "there",
      ticketId,
      title,
      severity: triage.severity,
      firstSteps: triage.suggested_first_steps,
      appUrl: APP_URL,
    });

    try {
      await sendMessage(customer.phone, customerMessage, channel);
      await admin.from("notifications_log").insert({
        ticket_id: ticketId,
        recipient_phone: customer.phone,
        channel,
        message: customerMessage,
        status: "sent",
      });
    } catch (err) {
      console.error("Failed to send customer notification:", err);
      await admin.from("notifications_log").insert({
        ticket_id: ticketId,
        recipient_phone: customer.phone,
        channel,
        message: customerMessage,
        status: "failed",
      });
    }

    // Send technician team alert
    const technicianMessage = buildTechnicianTicketMessage({
      ticketId,
      severity: triage.severity,
      customerName: customer.name || "Unknown",
      customerPhone: customer.phone,
      deviceType,
      aiSummary: triage.summary,
      technicianNotes: triage.technician_notes,
      appUrl: APP_URL,
    });

    // Get all technicians
    const { data: technicians } = await admin
      .from("users")
      .select("phone, notification_preference")
      .eq("role", "technician");

    if (technicians && technicians.length > 0) {
      for (const tech of technicians) {
        const techChannel: NotificationChannel = tech.notification_preference || "sms";
        try {
          await sendMessage(tech.phone, technicianMessage, techChannel);
          await admin.from("notifications_log").insert({
            ticket_id: ticketId,
            recipient_phone: tech.phone,
            channel: techChannel,
            message: technicianMessage,
            status: "sent",
          });
        } catch (err) {
          console.error(`Failed to notify technician ${tech.phone}:`, err);
        }
      }
    }

    return NextResponse.json(
      {
        ticketId,
        severity: triage.severity,
        summary: triage.summary,
        firstSteps: triage.suggested_first_steps,
        estimatedTime: triage.estimated_time,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Ticket creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Get user profile to check role
    const { data: profile } = await admin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let query = admin
      .from("tickets")
      .select(
        `*, customer:users!tickets_customer_id_fkey(id, phone, name, notification_preference), technician:users!tickets_technician_id_fkey(id, phone, name)`
      )
      .order("created_at", { ascending: false });

    if (profile.role !== "technician") {
      query = query.eq("customer_id", user.id);
    }

    const { data: tickets, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Get tickets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
