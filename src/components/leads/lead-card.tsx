import type { Lead } from "@/lib/types";
import { formatCurrency, LEAD_SOURCE_CONFIG } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function isOverdue(lead: Lead): boolean {
  if (!lead.nextFollowUpAt) return false;
  if (lead.status !== "new" && lead.status !== "contacted") return false;
  return new Date(lead.nextFollowUpAt) < new Date();
}

export default function LeadCard({
  lead,
  isDragging,
}: {
  lead: Lead;
  isDragging?: boolean;
}) {
  const sourceConfig = LEAD_SOURCE_CONFIG[lead.source] ?? LEAD_SOURCE_CONFIG.other;
  const overdue = isOverdue(lead);

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-3 transition-shadow",
        isDragging
          ? "shadow-xl ring-2 ring-indigo-400"
          : "shadow-sm hover:shadow-md"
      )}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-zinc-900">
          {lead.title}
        </p>
        {overdue && (
          <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
            Overdue
          </span>
        )}
      </div>

      {lead.estimatedValue > 0 && (
        <p className="mb-2 text-sm font-bold text-zinc-900">
          {formatCurrency(lead.estimatedValue)}
        </p>
      )}

      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
            sourceConfig.className
          )}
        >
          {sourceConfig.label}
        </span>
      </div>
    </div>
  );
}
