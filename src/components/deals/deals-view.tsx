"use client";

import React, { useState } from "react";
import ViewSwitcher, { type ViewType } from "@/components/shared/view-switcher";
import DealsGrid from "./deals-grid";
import DealCard from "./deal-card";
import KanbanBoard from "@/components/shared/kanban-board";
import CalendarView from "@/components/shared/calendar-view";
import { useDealsStore } from "@/store/use-deals-store";
import {
  DEAL_STAGES,
  DEAL_STAGE_CONFIG,
  formatCurrency,
  type Deal,
  type DealStage,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { FilterColumnDef } from "@/components/shared/filter-builder";

const FILTER_COLUMNS: FilterColumnDef[] = [
  { id: "title", label: "Title", dataType: "text" },
  { id: "value", label: "Value", dataType: "number" },
  {
    id: "stage",
    label: "Stage",
    dataType: "select",
    selectOptions: Object.entries(DEAL_STAGE_CONFIG).map(([key, val]) => ({
      value: key,
      label: val.label,
    })),
  },
  { id: "probability", label: "Prob. %", dataType: "number" },
  { id: "expectedCloseDate", label: "Close Date", dataType: "date" },
  { id: "notes", label: "Notes", dataType: "text" },
  { id: "createdAt", label: "Created", dataType: "date" },
];

const STAGE_COLORS: Record<
  string,
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

export default function DealsView({
  onRowClick,
}: {
  onRowClick?: (row: Deal) => void;
}) {
  const [view, setView] = useState<ViewType>("kanban");
  const { deals, moveDeal } = useDealsStore();

  const viewSwitcher = (
    <ViewSwitcher
      current={view}
      onChange={setView}
      views={["grid", "kanban", "calendar"]}
    />
  );

  if (view === "kanban") {
    return (
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center border-b border-zinc-200 px-3 py-2 sm:px-4 sm:py-2.5">
          <h1 className="mr-3 text-base font-semibold text-zinc-900">Deals</h1>
          {viewSwitcher}
        </div>
        <div className="flex-1 overflow-hidden">
          <KanbanBoard<Deal>
            data={deals}
            stages={DEAL_STAGES}
            getStage={(deal) => deal.stage}
            onMove={(dealId, newStage, newIndex) =>
              moveDeal(dealId, newStage as DealStage, newIndex)
            }
            renderCard={(deal, isDragging) => (
              <DealCard deal={deal} isDragging={isDragging} />
            )}
            stageColors={STAGE_COLORS}
            getStageSummary={(items) =>
              formatCurrency(items.reduce((s, d) => s + d.value, 0))
            }
            onItemClick={onRowClick}
            filterColumns={FILTER_COLUMNS}
          />
        </div>
      </div>
    );
  }

  if (view === "calendar") {
    return (
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center border-b border-zinc-200 px-3 py-2 sm:px-4 sm:py-2.5">
          <h1 className="mr-3 text-base font-semibold text-zinc-900">Deals</h1>
          {viewSwitcher}
        </div>
        <div className="flex-1 overflow-hidden">
          <CalendarView<Deal>
            items={deals}
            getDate={(deal) => deal.expectedCloseDate}
            onItemClick={onRowClick}
            entityName="Deals"
            filterColumns={FILTER_COLUMNS}
            renderItem={(deal) => (
              <div
                className={cn(
                  "truncate rounded px-1.5 py-0.5 text-[11px] font-medium",
                  DEAL_STAGE_CONFIG[deal.stage].className
                )}
              >
                {deal.title}
              </div>
            )}
          />
        </div>
      </div>
    );
  }

  return (
    <DealsGrid onRowClick={onRowClick} titleExtra={viewSwitcher} />
  );
}
