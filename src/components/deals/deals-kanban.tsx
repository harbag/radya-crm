"use client";

import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { useDealsStore } from "@/store/use-deals-store";
import { DEAL_STAGES, formatCurrency, type DealStage } from "@/lib/mock-data";
import KanbanColumn from "./kanban-column";

export default function DealsKanban() {
  const { deals, moveDeal } = useDealsStore();

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const { draggableId, source, destination } = result;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    moveDeal(draggableId, destination.droppableId as DealStage, destination.index);
  }

  const totalPipeline = deals
    .filter((d) => d.stage !== "closed_lost")
    .reduce((s, d) => s + d.value, 0);

  const closedWon = deals
    .filter((d) => d.stage === "closed_won")
    .reduce((s, d) => s + d.value, 0);

  const activeDeals = deals.filter(
    (d) => d.stage !== "closed_won" && d.stage !== "closed_lost"
  ).length;

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-2.5">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-zinc-900">
            Deals Pipeline
          </h1>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
            {deals.length}
          </span>
        </div>

        <div className="flex items-center gap-5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Pipeline</span>
            <span className="font-semibold text-zinc-800">
              {formatCurrency(totalPipeline)}
            </span>
          </div>
          <div className="h-3.5 w-px bg-zinc-200" />
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Won</span>
            <span className="font-semibold text-emerald-600">
              {formatCurrency(closedWon)}
            </span>
          </div>
          <div className="h-3.5 w-px bg-zinc-200" />
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Active</span>
            <span className="font-semibold text-zinc-800">{activeDeals}</span>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-3 p-5" style={{ minWidth: "max-content" }}>
            {DEAL_STAGES.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                deals={deals.filter((d) => d.stage === stage.id)}
              />
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
