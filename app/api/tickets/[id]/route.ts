import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { sendMessage } from "@/lib/twilio";
import { buildResolutionMessage } from "@/lib/utils";
import type { TicketStatus, NotificationChannel } from "@/lib/types";


export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: ticket, error } = await admin
      .from("tickets")
      .select(
        `*, customer:users!tickets_customer_id_fkey(id, phone, name, notification_preference), technician:users!tickets_technician_id_fkey(id, phone, name)`
      )
      .eq("id", params.id)
      .single();

    if (error || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Check access: customer can only see their own ticket
    const { data: profile } = await admin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "technician" && ticket.customer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Get ticket error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Check role
    const { data: profile } = await admin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "technician") {
      return NextResponse.json({ error: "Forbidden: technicians only" }, { status: 403 });
    }

    const body = await req.json();
    const { status, technicianNotes, resolutionNotes, action } = body;

    // Get current ticket
    const { data: ticket } = await admin
      .from("tickets")
      .select(
        `*, customer:users!tickets_customer_id_fkey(phone, name, notification_preference)`
      )
      .eq("id", params.id)
      .single();

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Build update object
    const updates: Record<string, unknown> = {};

    if (action === "claim") {
      // Check not already claimed by another tech
      if (ticket.technician_id && ticket.technician_id !== user.id) {
        return NextResponse.json(
          { error: "Ticket already claimed by another technician" },
          { status: 409 }
        );
      }
      updates.technician_id = user.id;
      updates.status = "assigned";
    } else {
      if (status) updates.status = status as TicketStatus;
      if (technicianNotes !== undefined) updates.technician_notes = technicianNotes;
      if (resolutionNotes !== undefined) updates.resolution_notes = resolutionNotes;
      if (status === "resolved") {
        updates.resolved_at = new Date().toISOString();
      }
    }

    const { data: updated, error: updateError } = await admin
      .from("tickets")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (updateError) {
      console.error("Ticket update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update ticket" },
        { status: 500 }
      );
    }

    // Send resolution notification to customer
    if (status === "resolved" && resolutionNotes && ticket.customer) {
      const channel: NotificationChannel =
        ticket.customer.notification_preference || "sms";
      const message = buildResolutionMessage({
        ticketId: params.id,
        title: ticket.title,
        resolutionNotes,
      });

      try {
        await sendMessage(ticket.customer.phone, message, channel);
        await admin.from("notifications_log").insert({
          ticket_id: params.id,
          recipient_phone: ticket.customer.phone,
          channel,
          message,
          status: "sent",
        });
      } catch (err) {
        console.error("Failed to send resolution notification:", err);
      }
    }

    return NextResponse.json({ ticket: updated });
  } catch (error) {
    console.error("Update ticket error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
