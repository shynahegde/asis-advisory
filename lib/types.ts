export type Role = "customer" | "technician";
export type NotificationPreference = "sms" | "whatsapp";
export type DeviceType =
  | "Desktop"
  | "Laptop"
  | "Phone"
  | "Tablet"
  | "Smart Home"
  | "Network"
  | "Other";
export type TicketStatus =
  | "submitted"
  | "triaging"
  | "assigned"
  | "in_progress"
  | "resolved";
export type Severity = "remote" | "onsite";
export type NotificationChannel = "sms" | "whatsapp";

export interface User {
  id: string;
  phone: string;
  name: string | null;
  role: Role;
  notification_preference: NotificationPreference;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  customer_id: string;
  technician_id: string | null;
  title: string;
  description: string;
  device_type: DeviceType;
  os: string | null;
  status: TicketStatus;
  severity: Severity | null;
  ai_summary: string | null;
  ai_first_steps: string[] | null;
  ai_estimated_time: string | null;
  technician_notes: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  // Joined fields
  customer?: Pick<User, "id" | "phone" | "name" | "notification_preference">;
  technician?: Pick<User, "id" | "phone" | "name"> | null;
}

export interface TriageResult {
  severity: Severity;
  summary: string;
  estimated_time: string;
  suggested_first_steps: string[];
  technician_notes: string;
}

export interface NotificationLog {
  id: string;
  ticket_id: string;
  recipient_phone: string;
  channel: NotificationChannel;
  message: string;
  sent_at: string;
  status: "sent" | "failed" | "pending";
}
