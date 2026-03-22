import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generate a ticket ID in TKT-XXXXXX format */
export function generateTicketId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "TKT-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/** Format a timestamp as relative time (e.g., "5 minutes ago") */
export function timeAgo(timestamp: string): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

/** Format a timestamp in local timezone */
export function formatLocalTime(timestamp: string): string {
  return format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a");
}

/** Format just the time */
export function formatTime(timestamp: string): string {
  return format(new Date(timestamp), "h:mm a");
}

/** Format date */
export function formatDate(timestamp: string): string {
  return format(new Date(timestamp), "MMM d, yyyy");
}

/** Get human-readable status label for customers */
export function getCustomerStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    submitted: "Request Received",
    triaging: "Being Reviewed",
    assigned: "Technician Assigned",
    in_progress: "Work in Progress",
    resolved: "Issue Resolved",
  };
  return labels[status] || status;
}

/** Get customer-friendly status description */
export function getCustomerStatusDescription(
  status: string,
  severity?: string | null
): string {
  switch (status) {
    case "submitted":
      return "We've received your request and are looking into it now.";
    case "triaging":
      return "Our team is reviewing your request to figure out the best way to help.";
    case "assigned":
      return severity === "remote"
        ? "A technician has been assigned and will contact you shortly."
        : "A technician has been assigned and will schedule a visit soon.";
    case "in_progress":
      return severity === "remote"
        ? "A technician is actively working on your issue."
        : "A technician is on the way or currently working on your issue.";
    case "resolved":
      return "Your issue has been resolved! If you have any questions, please get in touch.";
    default:
      return "Your request is being processed.";
  }
}

/** Format phone number for display */
export function formatPhone(phone: string): string {
  // Simple E.164 format display
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

/** Build the customer ticket notification message */
export function buildCustomerTicketMessage(params: {
  name: string;
  ticketId: string;
  title: string;
  severity: string;
  firstSteps: string[];
  appUrl: string;
}): string {
  const { name, ticketId, title, severity, firstSteps, appUrl } = params;
  const slaText =
    severity === "remote"
      ? "we'll reach out in 10 minutes"
      : "a technician will schedule a visit within 48 hours";
  const steps = firstSteps.slice(0, 2).join(", ");

  return `Hi ${name || "there"}! Your TechRescue ticket #${ticketId} has been received. 🛠️

Issue: ${title}
Assessment: ${severity === "remote" ? "Remote support" : "Onsite visit"} — ${slaText}.
Next steps: ${steps}

Track your ticket: ${appUrl}/status/${ticketId}`;
}

/** Build the technician team notification message */
export function buildTechnicianTicketMessage(params: {
  ticketId: string;
  severity: string;
  customerName: string;
  customerPhone: string;
  deviceType: string;
  aiSummary: string;
  technicianNotes: string;
  appUrl: string;
}): string {
  const {
    ticketId,
    severity,
    customerName,
    customerPhone,
    deviceType,
    aiSummary,
    technicianNotes,
    appUrl,
  } = params;

  return `🔔 New ${severity.toUpperCase()} Ticket #${ticketId}
Customer: ${customerName || "Unknown"} (${customerPhone})
Device: ${deviceType}
Issue: ${aiSummary}
Tech Notes: ${technicianNotes}
View: ${appUrl}/tech/job/${ticketId}`;
}

/** Build resolution notification message */
export function buildResolutionMessage(params: {
  ticketId: string;
  title: string;
  resolutionNotes: string;
}): string {
  const { ticketId, title, resolutionNotes } = params;
  return `✅ Your TechRescue issue has been resolved!
Ticket #${ticketId}: ${title}
Resolution: ${resolutionNotes}
Thanks for choosing TechRescue!`;
}
