"use client";

import { Droppable, Draggable } from "@hello-pangea/dnd";
import type { Deal, DealStage } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/mock-data";
import DealCard from "./deal-card";
import { cn } from "@/lib/utils";

const STAGE_COLORS: Record<
  DealStage,
  { dot: string; header: string; droppable: string }
> = {
  prospecting: {
    dot: "bg-blue-400",
    header: "text-blue-700",
    droppable: "bg-blue-50/60",
  },
  proposal: {
    dot: "bg-amber-400",
    header: "text-amber-700",
    droppable: "bg-amber-50/60",
  },
  negotiation: {
    dot: "bg-orange-400",
    header: "text-orange-700",
    droppable: "bg-orange-50/60",
  },
  closed_won: {
    dot: "bg-emerald-400",
    header: "text-emerald-700",
    droppable: "bg-emerald-50/60",
  },
  closed_lost: {
    dot: "bg-red-400",
    header: "text-red-700",
    droppable: "bg-red-50/60",
  },
};

type Props = {
  stage: { id: DealStage; label: string };
  deals: Deal[];
};

export default function KanbanColumn({ stage, deals }: Props) {
  const colors = STAGE_COLORS[stage.id];
  const total = deals.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex w-[272px] shrink-0 flex-col">
      {/* Column header */}
      <div className="mb-2 flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full shrink-0", colors.dot)} />
          <span className={cn("text-sm font-semibold", colors.header)}>
            {stage.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {deals.length > 0 && (
            <span className="text-xs text-zinc-400">
              {formatCurrency(total)}
            </span>
          )}
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-100 px-1.5 text-xs font-medium text-zinc-500">
            {deals.length}
          </span>
        </div>
      </div>

      {/* Droppable */}
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex flex-1 flex-col gap-2 rounded-xl p-2 transition-colors min-h-[120px]",
              snapshot.isDraggingOver ? colors.droppable : "bg-zinc-50"
            )}
          >
            {deals.map((deal, index) => (
              <Draggable key={deal.id} draggableId={deal.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(
                      "transition-opacity",
                      snapshot.isDragging ? "opacity-90" : "opacity-100"
                    )}
                  >
                    <DealCard deal={deal} isDragging={snapshot.isDragging} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {deals.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-1 items-center justify-center py-8 text-xs text-zinc-300">
                No deals
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
