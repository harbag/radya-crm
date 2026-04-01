"use client";

import React, { useState, useMemo } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import FilterBuilder, {
  evaluateFilters,
  type FilterColumnDef,
  type FilterState,
} from "./filter-builder";

// ── Types ───────────────────────────────────────────────────────────────────
type StageColors = {
  dot: string;
  header: string;
  droppable: string;
};

type KanbanBoardProps<T extends { id: string }> = {
  data: T[];
  stages: { id: string; label: string }[];
  getStage: (item: T) => string;
  onMove: (itemId: string, newStage: string, newIndex: number) => void;
  renderCard: (item: T, isDragging: boolean) => React.ReactNode;
  stageColors: Record<string, StageColors>;
  getStageSummary?: (items: T[]) => string;
  onItemClick?: (item: T) => void;
  filterColumns?: FilterColumnDef[];
};

// ── Component ───────────────────────────────────────────────────────────────
export default function KanbanBoard<T extends { id: string }>({
  data,
  stages,
  getStage,
  onMove,
  renderCard,
  stageColors,
  getStageSummary,
  onItemClick,
  filterColumns,
}: KanbanBoardProps<T>) {
  const [filterState, setFilterState] = useState<FilterState>({
    conditions: [],
    conjunction: "and",
  });

  const filteredData = useMemo(() => {
    if (!filterColumns || filterState.conditions.length === 0) return data;
    return data.filter((row) =>
      evaluateFilters(row as unknown as Record<string, unknown>, filterState, filterColumns)
    );
  }, [data, filterState, filterColumns]);
  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    onMove(draggableId, destination.droppableId, destination.index);
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {filterColumns && filterColumns.length > 0 && (
        <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-1.5 sm:px-4">
          <FilterBuilder
            filterColumns={filterColumns}
            filterState={filterState}
            onFilterChange={setFilterState}
          />
          {filterState.conditions.length > 0 && (
            <span className="text-xs text-zinc-400">
              {filteredData.length} of {data.length} items
            </span>
          )}
        </div>
      )}
      <div className="flex h-full gap-3 overflow-x-auto p-3 sm:gap-4 sm:p-4">
        {stages.map((stage) => {
          const items = filteredData.filter((item) => getStage(item) === stage.id);
          const colors = stageColors[stage.id] ?? {
            dot: "bg-zinc-400",
            header: "text-zinc-700",
            droppable: "bg-zinc-50/60",
          };

          return (
            <div key={stage.id} className="flex w-[240px] shrink-0 flex-col sm:w-[272px]">
              {/* Column header */}
              <div className="mb-2 flex items-center justify-between px-1 py-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      colors.dot
                    )}
                  />
                  <span
                    className={cn("text-sm font-semibold", colors.header)}
                  >
                    {stage.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {getStageSummary && items.length > 0 && (
                    <span className="text-xs text-zinc-400">
                      {getStageSummary(items)}
                    </span>
                  )}
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-100 px-1.5 text-xs font-medium text-zinc-500">
                    {items.length}
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
                      snapshot.isDraggingOver
                        ? colors.droppable
                        : "bg-zinc-50"
                    )}
                  >
                    {items.map((item, index) => (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "transition-opacity",
                              snapshot.isDragging
                                ? "opacity-90"
                                : "opacity-100"
                            )}
                            onClick={() => onItemClick?.(item)}
                          >
                            {renderCard(item, snapshot.isDragging)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {items.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex flex-1 items-center justify-center py-8 text-xs text-zinc-300">
                        No items
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
