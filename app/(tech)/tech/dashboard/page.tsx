"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  LogOut,
  ShieldCheck,
  Clock,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, SeverityBadge } from "@/components/StatusBadge";
import { createBrowserClient } from "@/lib/supabase-browser";
import { timeAgo } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { Ticket, TicketStatus } from "@/lib/types";

type Tab = "remote" | "onsite" | "all";

function isUrgent(ticket: Ticket): boolean {
  const created = new Date(ticket.created_at);
  const ageMs = Date.now() - created.getTime();
  const ageMins = ageMs / 1000 / 60;
  return ticket.severity === "remote" && ageMins > 8;
}

function TicketCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="pl-1 pr-5 py-5">
        <div className="pl-4">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3 mb-4" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

function JobCard({
  ticket,
  onClaim,
  onView,
  claiming,
}: {
  ticket: Ticket;
  onClaim: (id: string) => void;
  onView: (id: string) => void;
  claiming: string | null;
}) {
  const urgent = isUrgent(ticket);
  const isClaimed = !!ticket.technician_id;

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-md ${
        ticket.severity === "remote" ? "border-remote" : "border-onsite"
      }`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityBadge severity={ticket.severity!} />
            <StatusBadge status={ticket.status as TicketStatus} />
            {urgent && (
              <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[13px] font-semibold px-2 py-0.5 rounded-full" role="alert">
                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                Urgent
              </span>
            )}
          </div>
          <span
            className={`text-[13px] font-mono flex-shrink-0 ${
              urgent ? "text-red-600 font-bold" : "text-gray-400"
            }`}
          >
            {timeAgo(ticket.created_at)}
          </span>
        </div>

        {/* Customer + ticket */}
        <div className="mb-1">
          <p className="text-[13px] text-gray-500 font-mono">{ticket.id}</p>
          <h3 className="text-[17px] font-bold text-gray-900 leading-snug mt-0.5">{ticket.title}</h3>
        </div>

        <p className="text-[14px] text-gray-500 mb-1">
          {ticket.customer?.name || "Unknown"} · {ticket.customer?.phone}
        </p>
        <p className="text-[14px] text-gray-600 mb-3">
          {ticket.device_type}{ticket.os ? ` — ${ticket.os}` : ""}
        </p>

        {/* AI summary */}
        {ticket.ai_summary && (
          <div className="bg-warm-50 rounded-lg p-3 mb-3">
            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide mb-1">AI Assessment</p>
            <p className="text-[14px] text-gray-700 leading-relaxed">{ticket.ai_summary}</p>
          </div>
        )}

        {/* Assigned technician */}
        {ticket.technician && (
          <p className="text-[13px] text-gray-500 mb-3">
            Assigned to: <span className="font-semibold text-gray-700">{ticket.technician.name}</span>
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => onView(ticket.id)}
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            View Details
          </Button>

          {!isClaimed && (
            <Button
              onClick={() => onClaim(ticket.id)}
              size="sm"
              loading={claiming === ticket.id}
              className="flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              Claim Job
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TechDashboard() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("remote");
  const [claiming, setClaiming] = useState<string | null>(null);
  const [techName, setTechName] = useState<string>("");

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/tickets");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setTickets(data.tickets || []);
      }
    } catch {
      toast({ variant: "error", title: "Failed to load tickets", description: "Check your connection." });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Auth check + load name
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      supabase
        .from("users")
        .select("name, role")
        .eq("id", data.user.id)
        .single()
        .then(({ data: profile }: { data: { name: string | null; role: string } | null }) => {
          if (profile?.role !== "technician") {
            router.push("/submit");
            return;
          }
          setTechName(profile.name || "Technician");
        });
    });

    fetchTickets();
  }, [router, fetchTickets]);

  // Realtime
  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel("tickets-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        () => {
          fetchTickets();
          toast({ variant: "default", title: "Dashboard updated", description: "New ticket activity." });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTickets]);

  // Auto-refresh every 60s
  useEffect(() => {
    const timer = setInterval(fetchTickets, 60000);
    return () => clearInterval(timer);
  }, [fetchTickets]);

  async function handleClaim(ticketId: string) {
    setClaiming(ticketId);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: "error", title: "Couldn't claim ticket", description: data.error });
        return;
      }
      toast({ variant: "success", title: "Job claimed!", description: `Ticket ${ticketId} is now yours.` });
      fetchTickets();
    } catch {
      toast({ variant: "error", title: "Error", description: "Failed to claim job. Please try again." });
    } finally {
      setClaiming(null);
    }
  }

  async function handleSignOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  // Filter tickets
  const openStatuses: TicketStatus[] = ["submitted", "triaging", "assigned", "in_progress"];
  const openTickets = tickets.filter((t) => openStatuses.includes(t.status as TicketStatus));
  const resolvedTickets = tickets.filter((t) => t.status === "resolved");

  const remoteTickets = openTickets
    .filter((t) => t.severity === "remote")
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const onsiteTickets = openTickets
    .filter((t) => t.severity === "onsite")
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const displayTickets =
    activeTab === "remote"
      ? remoteTickets
      : activeTab === "onsite"
      ? onsiteTickets
      : openTickets;

  const urgentCount = remoteTickets.filter(isUrgent).length;

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center" aria-hidden="true">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-serif text-[18px] font-bold text-gray-900">TechRescue</span>
              <span className="text-[13px] text-gray-400 ml-2">Tech Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[15px] text-gray-500 hidden sm:block">Hi, {techName}</span>
            <button
              onClick={() => { setLoading(true); fetchTickets(); }}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 min-h-0 h-auto"
              aria-label="Refresh dashboard"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-[14px] text-gray-500 hover:text-gray-700 min-h-0 h-auto px-2 py-1"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:block">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-[28px] font-bold text-red-600">{remoteTickets.length}</div>
            <div className="text-[13px] text-gray-500 font-medium">Remote Jobs</div>
            {urgentCount > 0 && (
              <div className="text-[12px] text-red-500 font-semibold mt-1">{urgentCount} urgent</div>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-[28px] font-bold text-primary-700">{onsiteTickets.length}</div>
            <div className="text-[13px] text-gray-500 font-medium">Onsite Jobs</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-[28px] font-bold text-gray-700">{openTickets.length}</div>
            <div className="text-[13px] text-gray-500 font-medium">Open Total</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-[28px] font-bold text-success-600">{resolvedTickets.length}</div>
            <div className="text-[13px] text-gray-500 font-medium">Resolved Today</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6" role="tablist" aria-label="Job queue tabs">
          {([
            { key: "remote", label: "🔴 Remote", count: remoteTickets.length },
            { key: "onsite", label: "🟡 Onsite", count: onsiteTickets.length },
            { key: "all", label: "All Open", count: openTickets.length },
          ] as const).map(({ key, label, count }) => (
            <button
              key={key}
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[15px] font-semibold transition-colors min-h-0 h-auto ${
                activeTab === key
                  ? "bg-white border-2 border-primary-700 text-primary-700 shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {label}
              <span
                className={`text-[13px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === key ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Job queue */}
        {loading ? (
          <div className="grid gap-4" role="status" aria-label="Loading jobs">
            <span className="sr-only">Loading jobs...</span>
            {[1, 2, 3].map((i) => <TicketCardSkeleton key={i} />)}
          </div>
        ) : displayTickets.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" aria-hidden="true" />
            <h3 className="font-serif text-[20px] font-semibold text-gray-500 mb-2">
              {activeTab === "remote" ? "No remote jobs" : activeTab === "onsite" ? "No onsite jobs" : "No open jobs"}
            </h3>
            <p className="text-[16px] text-gray-400">
              {activeTab === "remote"
                ? "No urgent remote support requests right now."
                : "All clear — check back soon."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4" role="list" aria-label="Job queue">
            {displayTickets.map((ticket) => (
              <div key={ticket.id} role="listitem">
                <JobCard
                  ticket={ticket}
                  onClaim={handleClaim}
                  onView={(id) => router.push(`/tech/job/${id}`)}
                  claiming={claiming}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
