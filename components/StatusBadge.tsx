import { Badge } from "@/components/ui/badge";
import type { TicketStatus, Severity } from "@/lib/types";

const STATUS_LABELS: Record<TicketStatus, string> = {
  submitted: "Received",
  triaging: "Being Reviewed",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
};

const STATUS_VARIANTS: Record<TicketStatus, "submitted" | "triaging" | "assigned" | "in_progress" | "resolved"> = {
  submitted: "submitted",
  triaging: "triaging",
  assigned: "assigned",
  in_progress: "in_progress",
  resolved: "resolved",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge variant={STATUS_VARIANTS[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge variant={severity}>
      {severity === "remote" ? "🔴 Remote" : "🟡 Onsite"}
    </Badge>
  );
}
