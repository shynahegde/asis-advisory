"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Phone,
  MessageSquare,
  Clock,
  AlertCircle,
  Loader2,
  CheckCircle,
  ShieldCheck,
  User,
  Laptop,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge, SeverityBadge } from "@/components/StatusBadge";
import { toast } from "@/hooks/use-toast";
import {
  formatLocalTime,
  timeAgo,
  getCustomerStatusLabel,
} from "@/lib/utils";
import type { Ticket, TicketStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

export default function TechJobDetail() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.ticketId as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<TicketStatus>("assigned");
  const [techNotes, setTechNotes] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [isTech, setIsTech] = useState(false);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`);
      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) { toast({ variant: "error", title: "Ticket not found" }); router.push("/tech/dashboard"); return; }
      const data = await res.json();
      const t: Ticket = data.ticket;
      setTicket(t);
      setStatus(t.status as TicketStatus);
      setTechNotes(t.technician_notes || "");
      setResolutionNotes(t.resolution_notes || "");
    } catch {
      toast({ variant: "error", title: "Failed to load ticket" });
    } finally {
      setLoading(false);
    }
  }, [ticketId, router]);

  useEffect(() => {
    // Auth check
    import("@/lib/supabase-browser").then(({ createBrowserClient }) => {
      const supabase = createBrowserClient();
      supabase.auth.getUser().then(({ data }) => {
        if (!data.user) { router.push("/login"); return; }
        supabase.from("users").select("role").eq("id", data.user.id).single().then(({ data: p }: { data: { role: string } | null }) => {
          if (p?.role !== "technician") { router.push("/submit"); return; }
          setIsTech(true);
        });
      });
    });
    fetchTicket();
  }, [router, fetchTicket]);

  async function handleSaveNotes() {
    setSaving(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianNotes: techNotes }),
      });
      if (!res.ok) throw new Error();
      toast({ variant: "success", title: "Notes saved!" });
    } catch {
      toast({ variant: "error", title: "Failed to save notes" });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateStatus(newStatus: TicketStatus) {
    if (newStatus === "resolved") {
      if (!resolutionNotes.trim()) {
        toast({ variant: "warning", title: "Please add resolution notes before resolving." });
        return;
      }
      setShowResolveConfirm(true);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setStatus(newStatus);
      toast({ variant: "success", title: `Status updated to "${getCustomerStatusLabel(newStatus)}"` });
      fetchTicket();
    } catch {
      toast({ variant: "error", title: "Failed to update status" });
    } finally {
      setSaving(false);
    }
  }

  async function handleResolve() {
    setShowResolveConfirm(false);
    setSaving(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          resolutionNotes,
          technicianNotes: techNotes,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("resolved");
      toast({
        variant: "success",
        title: "Ticket resolved!",
        description: "Customer has been notified.",
      });
      fetchTicket();
    } catch {
      toast({ variant: "error", title: "Failed to resolve ticket" });
    } finally {
      setSaving(false);
    }
  }

  async function handleClaim() {
    setSaving(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: "error", title: data.error || "Couldn't claim ticket" });
        return;
      }
      toast({ variant: "success", title: "Job claimed!", description: "This job is now yours." });
      fetchTicket();
    } catch {
      toast({ variant: "error", title: "Failed to claim job" });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !isTech) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-700 animate-spin" aria-hidden="true" />
      </div>
    );
  }

  if (!ticket) return null;

  const isResolved = ticket.status === "resolved";
  const isClaimed = !!ticket.technician_id;

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Resolve confirmation dialog */}
      {showResolveConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resolve-dialog-title"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-success-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h2 id="resolve-dialog-title" className="font-serif text-[20px] font-bold text-gray-900">
                  Mark as resolved?
                </h2>
                <p className="text-[16px] text-gray-600 mt-1">
                  This will notify the customer via SMS/WhatsApp with your resolution notes. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="bg-warm-50 rounded-lg p-3 mb-6">
              <p className="text-[14px] font-semibold text-gray-500 mb-1">Resolution message</p>
              <p className="text-[15px] text-gray-700">{resolutionNotes}</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="default"
                className="flex-1"
                onClick={() => setShowResolveConfirm(false)}
              >
                Go back
              </Button>
              <Button
                variant="success"
                size="default"
                className="flex-1"
                onClick={handleResolve}
                loading={saving}
              >
                Yes, resolve
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push("/tech/dashboard")}
            className="flex items-center gap-2 text-[16px] text-gray-500 hover:text-gray-700 min-h-0 h-auto"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            Dashboard
          </button>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[15px] text-primary-700 font-bold">{ticket.id}</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Status + severity */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <SeverityBadge severity={ticket.severity!} />
            <StatusBadge status={ticket.status as TicketStatus} />
            {isUrgent(ticket) && (
              <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[13px] font-semibold px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                SLA at risk
              </span>
            )}
          </div>

          <h1 className="font-serif text-[24px] font-bold text-gray-900 mb-1">{ticket.title}</h1>
          <div className="flex items-center gap-3 text-[14px] text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              {formatLocalTime(ticket.created_at)}
            </span>
            <span>·</span>
            <span>{timeAgo(ticket.created_at)}</span>
          </div>

          {!isClaimed && !isResolved && (
            <Button
              onClick={handleClaim}
              className="mt-4"
              loading={saving}
            >
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              Claim This Job
            </Button>
          )}
          {ticket.technician && (
            <p className="mt-3 text-[14px] text-gray-500">
              Assigned to: <span className="font-semibold text-gray-700">{ticket.technician.name}</span>
            </p>
          )}
        </div>

        {/* Customer info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-serif text-[18px] font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" aria-hidden="true" />
            Customer
          </h2>
          <div className="space-y-2">
            <p className="text-[17px] font-semibold text-gray-900">{ticket.customer?.name || "Unknown"}</p>
            <p className="text-[16px] text-gray-600">{ticket.customer?.phone}</p>
            <p className="text-[14px] text-gray-400">
              Prefers: {ticket.customer?.notification_preference === "whatsapp" ? "WhatsApp" : "SMS"}
            </p>
          </div>
          <div className="flex gap-3 mt-4">
            <a
              href={`tel:${ticket.customer?.phone}`}
              className="flex-1 flex items-center justify-center gap-2 h-[48px] rounded-lg border-2 border-gray-200 text-[15px] font-semibold text-gray-700 hover:border-primary-700 hover:text-primary-700 transition-colors"
              aria-label={`Call ${ticket.customer?.name || "customer"}`}
            >
              <Phone className="w-4 h-4" aria-hidden="true" />
              Call
            </a>
            <a
              href={`sms:${ticket.customer?.phone}`}
              className="flex-1 flex items-center justify-center gap-2 h-[48px] rounded-lg border-2 border-gray-200 text-[15px] font-semibold text-gray-700 hover:border-primary-700 hover:text-primary-700 transition-colors"
              aria-label={`Text ${ticket.customer?.name || "customer"}`}
            >
              <MessageSquare className="w-4 h-4" aria-hidden="true" />
              Text
            </a>
          </div>
        </div>

        {/* Issue details */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-serif text-[18px] font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Laptop className="w-4 h-4 text-gray-400" aria-hidden="true" />
            Issue Details
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-[13px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Device</p>
              <p className="text-[16px] text-gray-700">{ticket.device_type}{ticket.os ? ` — ${ticket.os}` : ""}</p>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Customer description</p>
              <p className="text-[16px] text-gray-700 leading-relaxed">{ticket.description}</p>
            </div>
          </div>
        </div>

        {/* AI Triage */}
        {ticket.ai_summary && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <h2 className="font-serif text-[18px] font-semibold text-gray-800 mb-4">
              AI Triage Assessment
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Summary</p>
                <p className="text-[16px] text-gray-700 leading-relaxed">{ticket.ai_summary}</p>
              </div>
              {ticket.ai_estimated_time && (
                <div>
                  <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Estimated time</p>
                  <p className="text-[16px] text-gray-700">{ticket.ai_estimated_time}</p>
                </div>
              )}
              {ticket.ai_first_steps && ticket.ai_first_steps.length > 0 && (
                <div>
                  <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Suggested steps</p>
                  <ul className="space-y-2">
                    {ticket.ai_first_steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-[15px] text-gray-700">
                        <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Technician notes (internal) */}
        {!isResolved && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
            <h2 className="font-serif text-[18px] font-semibold text-gray-800 mb-1">
              AI Technical Notes
            </h2>
            <p className="text-[13px] text-amber-700 mb-3">Internal — not visible to customer</p>
            {ticket.technician_notes && (
              <div className="bg-amber-100/50 rounded-lg p-3 mb-4">
                <p className="text-[15px] text-amber-900 leading-relaxed">{ticket.technician_notes}</p>
              </div>
            )}
            <Textarea
              label="Your notes"
              hint="Add your own observations, steps taken, or anything useful for this job."
              placeholder="e.g. Checked Event Viewer — found driver error. Trying update first..."
              rows={4}
              value={techNotes}
              onChange={(e) => setTechNotes(e.target.value)}
            />
            <Button
              onClick={handleSaveNotes}
              variant="secondary"
              size="sm"
              className="mt-3"
              loading={saving}
            >
              <Save className="w-4 h-4" aria-hidden="true" />
              Save Notes
            </Button>
          </div>
        )}

        {/* Status controls */}
        {!isResolved && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-serif text-[18px] font-semibold text-gray-800 mb-4">
              Update Status
            </h2>

            <div className="flex gap-2 flex-wrap mb-6" role="group" aria-label="Status options">
              {STATUS_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleUpdateStatus(value)}
                  disabled={saving || status === value || value === "resolved"}
                  className={`px-4 py-2.5 rounded-lg text-[15px] font-semibold border-2 transition-all min-h-0 h-auto ${
                    status === value
                      ? "border-primary-700 bg-primary-50 text-primary-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 disabled:opacity-40"
                  }`}
                  aria-pressed={status === value}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-[16px] font-semibold text-gray-700 mb-3">
                Resolve ticket
              </h3>
              <Textarea
                label="Resolution notes (visible to customer)"
                hint="Describe what you did to fix the issue. This will be sent to the customer."
                placeholder="Ran Windows Update and updated the display driver. The freezing was caused by an outdated GPU driver — all tests passing now."
                rows={4}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
              <Button
                onClick={() => handleUpdateStatus("resolved")}
                variant="success"
                size="default"
                className="w-full mt-4"
                loading={saving}
                disabled={!resolutionNotes.trim()}
              >
                <CheckCircle className="w-4 h-4" aria-hidden="true" />
                Mark Resolved &amp; Notify Customer
              </Button>
            </div>
          </div>
        )}

        {/* Resolved state */}
        {isResolved && (
          <div className="bg-success-50 border-2 border-success-600 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-success-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h2 className="font-serif text-[20px] font-bold text-success-700 mb-2">
                  Ticket Resolved
                </h2>
                {ticket.resolved_at && (
                  <p className="text-[14px] text-gray-500 mb-3">
                    Resolved {formatLocalTime(ticket.resolved_at)}
                  </p>
                )}
                {ticket.resolution_notes && (
                  <>
                    <p className="text-[13px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      Resolution
                    </p>
                    <p className="text-[16px] text-gray-700 leading-relaxed">
                      {ticket.resolution_notes}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function isUrgent(ticket: Ticket): boolean {
  const ageMs = Date.now() - new Date(ticket.created_at).getTime();
  return ticket.severity === "remote" && ageMs / 1000 / 60 > 8;
}
