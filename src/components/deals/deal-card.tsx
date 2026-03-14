import type { Deal } from "@/lib/mock-data";
import { formatCurrency, getContactById } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function DealCard({
  deal,
  isDragging,
}: {
  deal: Deal;
  isDragging?: boolean;
}) {
  const contact = getContactById(deal.contactId);

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-200 bg-white p-3 transition-shadow",
        isDragging ? "shadow-xl ring-2 ring-indigo-400" : "shadow-sm hover:shadow-md"
      )}
    >
      <p className="mb-1 text-sm font-medium leading-snug text-zinc-900">
        {deal.title}
      </p>

      <p className="mb-2.5 text-base font-bold text-zinc-900">
        {formatCurrency(deal.value)}
      </p>

      {contact && (
        <div className="mb-2 flex items-center gap-1.5">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-600">
            {contact.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <span className="text-xs text-zinc-500 truncate">{contact.name}</span>
        </div>
      )}

      {deal.notes && (
        <p className="mb-2 line-clamp-2 text-xs text-zinc-400">{deal.notes}</p>
      )}

      <div className="flex items-center gap-1 text-xs text-zinc-400">
        <span>Close:</span>
        <span>
          {new Date(deal.expectedCloseDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
