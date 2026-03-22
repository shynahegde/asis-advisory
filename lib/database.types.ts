export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          phone: string;
          name: string | null;
          role: "customer" | "technician";
          notification_preference: "sms" | "whatsapp";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          name?: string | null;
          role?: "customer" | "technician";
          notification_preference?: "sms" | "whatsapp";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          name?: string | null;
          role?: "customer" | "technician";
          notification_preference?: "sms" | "whatsapp";
          created_at?: string;
          updated_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          customer_id: string;
          technician_id: string | null;
          title: string;
          description: string;
          device_type: string;
          os: string | null;
          status: string;
          severity: string | null;
          ai_summary: string | null;
          ai_first_steps: string[] | null;
          ai_estimated_time: string | null;
          technician_notes: string | null;
          resolution_notes: string | null;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id: string;
          customer_id: string;
          technician_id?: string | null;
          title: string;
          description: string;
          device_type: string;
          os?: string | null;
          status?: string;
          severity?: string | null;
          ai_summary?: string | null;
          ai_first_steps?: string[] | null;
          ai_estimated_time?: string | null;
          technician_notes?: string | null;
          resolution_notes?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          customer_id?: string;
          technician_id?: string | null;
          title?: string;
          description?: string;
          device_type?: string;
          os?: string | null;
          status?: string;
          severity?: string | null;
          ai_summary?: string | null;
          ai_first_steps?: string[] | null;
          ai_estimated_time?: string | null;
          technician_notes?: string | null;
          resolution_notes?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
      };
      notifications_log: {
        Row: {
          id: string;
          ticket_id: string | null;
          recipient_phone: string;
          channel: "sms" | "whatsapp";
          message: string;
          sent_at: string;
          status: "sent" | "failed" | "pending";
        };
        Insert: {
          id?: string;
          ticket_id?: string | null;
          recipient_phone: string;
          channel: "sms" | "whatsapp";
          message: string;
          sent_at?: string;
          status?: "sent" | "failed" | "pending";
        };
        Update: {
          id?: string;
          ticket_id?: string | null;
          recipient_phone?: string;
          channel?: "sms" | "whatsapp";
          message?: string;
          sent_at?: string;
          status?: "sent" | "failed" | "pending";
        };
      };
    };
  };
}
