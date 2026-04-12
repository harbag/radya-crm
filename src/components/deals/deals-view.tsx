"use client";

import React, { useState } from "react";
import ViewSwitcher, { type ViewType } from "@/components/shared/view-switcher";
import DealsGrid from "./deals-grid";
import DealsKanban from "./deals-kanban";
import CalendarView from "@/components/shared/calendar-view";
import { useDealList, type DealRow } from "@/lib/queries/deals";
import type { Deal } from "@/lib/types";
import { DEAL_STAGE_CONFIG } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { FilterColumnDef } from "@/components/shared/filter-builder";
import { GridSkeleton, QueryError } from "@/components/shared/query-states";

function mapDealRow(row: DealRow): Deal {
  return {
    id: row.id,
    title: row.title,
    value: row.value,
    contactId: row.contact_id ?? "",
    companyId: row.company_id,
    stage: "prospecting",
    probability: row.probability,
    expectedCloseDate: row.expected_close_date ?? "",
    notes: "",
    stageId: row.stage_id ?? undefined,
    dealStatus: row.status,
    pipelineId: row.pipeline_id ?? undefined,
    stageChangedAt: row.stage_changed_at ?? undefined,
    lostReason: row.lost_reason ?? undefined,
    actualCloseDate: row.actual_close_date ?? undefined,
    ownerId: row.owner_id ?? undefined,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    createdBy: row.created_by ?? "",
    lastModifiedAt: row.updated_at,
    lastModifiedBy: "",
  };
}

const FILTER_COLUMNS: FilterColumnDef[] = [
  { id: "title", label: "Title", dataType: "text" },
  { id: "value", label: "Value", dataType: "number" },
  { id: "probability", label: "Prob. %", dataType: "number" },
  { id: "expectedCloseDate", label: "Close Date", dataType: "date" },
  { id: "createdAt", label: "Created", dataType: "date" },
];

export default function DealsView({
  onRowClick,
}: {
  onRowClick?: (row: Deal) => void;
}) {
  const [view, setView] = useState<ViewType>("kanban");
  const { data: rows, isLoading, error, refetch } = useDealList();

  const viewSwitcher = (
    <ViewSwitcher
      current={view}
      onChange={setView}
      views={["grid", "kanban", "calendar"]}
    />
  );

  if (view === "kanban") {
    return (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center border-b border-zinc-200 px-3 py-2 sm:px-4 sm:py-2.5">
          <h1 className="mr-3 text-base font-semibold text-zinc-900">Deals</h1>
          {viewSwitcher}
        </div>
        <div className="flex-1 overflow-hidden">
          <DealsKanban />
        </div>
      </div>
    );
  }

  if (view === "calendar") {
    if (isLoading) return <GridSkeleton />;
    if (error)
      return <QueryError message={error.message} onRetry={() => refetch()} />;

    const deals = (rows ?? []).map(mapDealRow);
    return (
      <div className="flex h-full flex-col bg-background">
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
                  DEAL_STAGE_CONFIG[deal.stage]?.className ??
                    "bg-blue-100 text-blue-700"
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

  return <DealsGrid onRowClick={onRowClick} titleExtra={viewSwitcher} />;
}
