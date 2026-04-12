import type { Deal } from "@/lib/types";
import { formatCurrency } from "@/lib/mock-data";
import { useAttachmentsStore } from "@/store/use-attachments-store";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

function daysSince(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function DealCard({
  deal,
  isDragging,
}: {
  deal: Deal;
  isDragging?: boolean;
}) {
  const coverImage = useAttachmentsStore((s) =>
    s.attachments.find(
      (a) =>
        a.linkedEntityType === "deal" &&
        a.linkedEntityId === deal.id &&
        a.type.startsWith("image/") &&
        a.thumbnailUrl
    )
  );

  const daysStale = daysSince(deal.stageChangedAt);
  const isStale =
    daysStale !== null && daysStale > 14 && deal.dealStatus === "open";

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card transition-shadow overflow-hidden",
        isDragging
          ? "shadow-xl ring-2 ring-indigo-400"
          : "shadow-sm hover:shadow-md"
      )}
    >
      {/* Cover image */}
      {coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImage.thumbnailUrl!}
          alt=""
          className="h-28 w-full object-cover"
        />
      )}

      <div className="p-3">
        <div className="mb-1 flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug text-zinc-900">
            {deal.title}
          </p>
          {isStale && (
            <div
              className="flex shrink-0 items-center gap-1 text-xs text-amber-500"
              title={`No activity for ${daysStale} days`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{daysStale}d</span>
            </div>
          )}
        </div>

        <p className="mb-2.5 text-base font-bold text-zinc-900">
          {formatCurrency(deal.value)}
        </p>

        {deal.expectedCloseDate && (
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
        )}
      </div>
    </div>
  );
}
