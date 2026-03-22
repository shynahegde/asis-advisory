"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  RefreshCw,
  Phone,
  MessageSquare,
  ChevronLeft,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { createBrowserClient } from "@/lib/supabase-browser";
import {
  getCustomerStatusLabel,
  getCustomerStatusDescription,
  formatLocalTime,
  timeAgo,
} from "@/lib/utils";
import type { Ticket, TicketStatus } from "@/lib/types";

const STATUS_STEPS: TicketStatus[] = [
  "submitted",
  "triaging",
  "assigned",
  "in_progress",
  "resolved",
];

const STEP_LABELS: Record<TicketStatus, string> = {
  submitted: "Received",
  triaging: "Being Reviewed",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
};

export default function StatusPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.ticketId as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`);
      if (res.status === 401) {
        router.push(`/login?redirect=/status/${ticketId}`);
        return;
      }
      if (res.status === 404) {
        setError("We couldn't find this request. Please check the ticket number.");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong loading your request.");
        return;
      }
      setTicket(data.ticket);
      setLastRefreshed(new Date());
      setError(null);
    } catch {
      setError("Unable to load your request. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [ticketId, router]);

  // Initial fetch
  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    refreshTimerRef.current = setInterval(fetchTicket, 30000);
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [fetchTicket]);

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel(`ticket:${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tickets",
          filter: `id=eq.${ticketId}`,
        },
        () => {
          fetchTicket();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, fetchTicket]);

  const currentStepIndex = ticket
    ? STATUS_STEPS.indexOf(ticket.status as TicketStatus)
    : -1;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary-700 animate-spin mx-auto mb-4" aria-hidden="true" />
          <p className="text-[18px] text-gray-600">Loading your request...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="px-6 py-5 border-b border-warm-100">
          <div className="max-w-lg mx-auto">
            <span className="font-serif text-[20px] font-semibold text-gray-900">TechRescue</span>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-md text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" aria-hidden="true" />
            <h1 className="font-serif text-[24px] font-bold text-gray-900 mb-3">Request not found</h1>
            <p className="text-[18px] text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push("/submit")} size="default">
              Submit a New Request
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!ticket) return null;

  const isResolved = ticket.status === "resolved";
  const statusLabel = getCustomerStatusLabel(ticket.status);
  const statusDescription = getCustomerStatusDescription(ticket.status, ticket.severity);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 py-5 border-b border-warm-100">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push("/submit")}
            className="flex items-center gap-2 text-[16px] text-gray-500 hover:text-gray-700 min-h-0"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            Back
          </button>
          <span className="font-serif text-[20px] font-semibold text-gray-900">TechRescue</span>
          <button
            onClick={() => { setLoading(true); fetchTicket(); }}
            className="flex items-center gap-2 text-[15px] text-gray-500 hover:text-primary-700 min-h-0"
            aria-label="Refresh status"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:block">Refresh</span>
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-10">
        {/* Ticket ID */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[14px] text-gray-500 font-medium">Ticket number</p>
            <p className="font-mono text-[20px] font-bold text-primary-700">{ticket.id}</p>
          </div>
          <StatusBadge status={ticket.status as TicketStatus} />
        </div>

        {/* Big status card */}
        <div
          className={`rounded-xl p-6 mb-6 ${
            isResolved
              ? "bg-success-50 border-2 border-success-600"
              : "bg-warm-50 border border-warm-200"
          }`}
        >
          {isResolved ? (
            <div className="flex items-start gap-4">
              <CheckCircle className="w-8 h-8 text-success-600 flex-shrink-0 mt-1" aria-hidden="true" />
              <div>
                <h2 className="font-serif text-[22px] font-bold text-success-700 mb-2">
                  Issue Resolved!
                </h2>
                <p className="text-[17px] text-gray-700 leading-relaxed">
                  {statusDescription}
                </p>
                {ticket.resolution_notes && (
                  <div className="mt-4 pt-4 border-t border-success-200">
                    <p className="text-[14px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      What was done
                    </p>
                    <p className="text-[16px] text-gray-700 leading-relaxed">
                      {ticket.resolution_notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="font-serif text-[22px] font-bold text-gray-900 mb-2">
                {statusLabel}
              </h2>
              <p className="text-[17px] text-gray-700 leading-relaxed mb-4">
                {statusDescription}
              </p>
              {ticket.severity && (
                <div className="flex items-center gap-2 text-[16px] text-gray-600">
                  <Clock className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span>
                    {ticket.severity === "remote"
                      ? "Expected response within 10 minutes"
                      : "Technician visit scheduled within 48 hours"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress tracker */}
        <div className="mb-6">
          <h3 className="text-[16px] font-semibold text-gray-700 mb-4">Progress</h3>
          <div className="relative" role="list" aria-label="Request progress">
            {STATUS_STEPS.map((s, i) => {
              const isComplete = i < currentStepIndex;
              const isCurrent = i === currentStepIndex;
              const isFuture = i > currentStepIndex;
              return (
                <div
                  key={s}
                  className="flex items-start gap-4 mb-4 last:mb-0"
                  role="listitem"
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {/* Connector line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        isComplete
                          ? "bg-success-600"
                          : isCurrent
                          ? "bg-primary-700"
                          : "bg-gray-100"
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle className="w-4 h-4 text-white" aria-hidden="true" />
                      ) : isCurrent ? (
                        <div className="w-2 h-2 bg-white rounded-full" aria-hidden="true" />
                      ) : (
                        <div className="w-2 h-2 bg-gray-300 rounded-full" aria-hidden="true" />
                      )}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        className={`w-0.5 h-8 mt-1 ${
                          isComplete ? "bg-success-600" : "bg-gray-100"
                        }`}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className="pt-1 pb-4">
                    <p
                      className={`text-[16px] font-semibold ${
                        isComplete
                          ? "text-success-700"
                          : isCurrent
                          ? "text-primary-700"
                          : isFuture
                          ? "text-gray-400"
                          : "text-gray-700"
                      }`}
                    >
                      {STEP_LABELS[s]}
                    </p>
                    {isCurrent && (
                      <p className="text-[14px] text-gray-500 mt-0.5">Current step</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Issue summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h3 className="font-serif text-[18px] font-semibold text-gray-800 mb-4">Your request</h3>
          <div className="space-y-3">
            <div>
              <span className="text-[13px] font-semibold text-gray-400 uppercase tracking-wide">Issue</span>
              <p className="text-[17px] text-gray-900 mt-1">{ticket.title}</p>
            </div>
            <div>
              <span className="text-[13px] font-semibold text-gray-400 uppercase tracking-wide">Device</span>
              <p className="text-[16px] text-gray-700 mt-1">
                {ticket.device_type}{ticket.os ? ` — ${ticket.os}` : ""}
              </p>
            </div>
            {ticket.ai_summary && (
              <div>
                <span className="text-[13px] font-semibold text-gray-400 uppercase tracking-wide">Our assessment</span>
                <p className="text-[16px] text-gray-700 mt-1 leading-relaxed">{ticket.ai_summary}</p>
              </div>
            )}
            {ticket.technician && (
              <div>
                <span className="text-[13px] font-semibold text-gray-400 uppercase tracking-wide">Your technician</span>
                <p className="text-[17px] text-gray-900 mt-1">{ticket.technician.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* What to try while waiting */}
        {ticket.ai_first_steps && ticket.ai_first_steps.length > 0 && !isResolved && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
            <h3 className="font-serif text-[18px] font-semibold text-gray-800 mb-3">
              Things to try while you wait
            </h3>
            <ul className="space-y-3">
              {ticket.ai_first_steps.slice(0, 3).map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-[16px] text-gray-700">
                  <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Contact options */}
        <div className="bg-warm-50 rounded-xl p-5 mb-8">
          <h3 className="text-[17px] font-semibold text-gray-800 mb-1">Need to reach us?</h3>
          <p className="text-[15px] text-gray-500 mb-4">We&apos;ll contact you — but you can also reach out directly.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="tel:+15551234567"
              className="flex-1 flex items-center justify-center gap-2 h-[52px] rounded-lg border-2 border-gray-200 text-[16px] font-semibold text-gray-700 hover:border-primary-700 hover:text-primary-700 transition-colors"
              aria-label="Call TechRescue support"
            >
              <Phone className="w-4 h-4" aria-hidden="true" />
              Call us
            </a>
            <a
              href="sms:+15551234567"
              className="flex-1 flex items-center justify-center gap-2 h-[52px] rounded-lg border-2 border-gray-200 text-[16px] font-semibold text-gray-700 hover:border-primary-700 hover:text-primary-700 transition-colors"
              aria-label="Text TechRescue support"
            >
              <MessageSquare className="w-4 h-4" aria-hidden="true" />
              Text us
            </a>
          </div>
        </div>

        {/* Last updated */}
        <p className="text-[13px] text-gray-400 text-center" aria-live="polite">
          Submitted {formatLocalTime(ticket.created_at)} ·{" "}
          Last updated{" "}
          {timeAgo(lastRefreshed.toISOString())}
        </p>
      </main>
    </div>
  );
}
