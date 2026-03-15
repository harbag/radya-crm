import type { Lead } from "@/lib/mock-data";
import {
  formatCurrency,
  getContactById,
  getCompanyById,
  LEAD_SOURCE_CONFIG,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function LeadCard({
  lead,
  isDragging,
}: {
  lead: Lead;
  isDragging?: boolean;
}) {
  const contact = lead.contactId ? getContactById(lead.contactId) : null;
  const company = lead.companyId ? getCompanyById(lead.companyId) : null;
  const sourceConfig = LEAD_SOURCE_CONFIG[lead.source];

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-200 bg-white p-3 transition-shadow",
        isDragging
          ? "shadow-xl ring-2 ring-indigo-400"
          : "shadow-sm hover:shadow-md"
      )}
    >
      <p className="mb-1 text-sm font-medium leading-snug text-zinc-900">
        {lead.title}
      </p>

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

      {(contact || company) && (
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          {contact && <span>{contact.name}</span>}
          {contact && company && <span>&middot;</span>}
          {company && <span>{company.name}</span>}
        </div>
      )}
    </div>
  );
}
