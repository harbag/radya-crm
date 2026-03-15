"use client";

import React, { useState } from "react";
import ViewSwitcher, { type ViewType } from "@/components/shared/view-switcher";
import LeadsGrid from "./leads-grid";
import LeadCard from "./lead-card";
import KanbanBoard from "@/components/shared/kanban-board";
import { useLeadsStore } from "@/store/use-leads-store";
import { LEAD_STATUS_CONFIG, formatCurrency, type Lead } from "@/lib/mock-data";

const LEAD_STAGES = Object.entries(LEAD_STATUS_CONFIG).map(([id, cfg]) => ({
  id,
  label: cfg.label,
}));

const STAGE_COLORS: Record<
  string,
  { dot: string; header: string; droppable: string }
> = {
  new: {
    dot: "bg-blue-400",
    header: "text-blue-700",
    droppable: "bg-blue-50/60",
  },
  contacted: {
    dot: "bg-yellow-400",
    header: "text-yellow-700",
    droppable: "bg-yellow-50/60",
  },
  qualified: {
    dot: "bg-green-400",
    header: "text-green-700",
    droppable: "bg-green-50/60",
  },
  unqualified: {
    dot: "bg-red-400",
    header: "text-red-700",
    droppable: "bg-red-50/60",
  },
};

export default function LeadsView({
  onRowClick,
}: {
  onRowClick?: (row: Lead) => void;
}) {
  const [view, setView] = useState<ViewType>("grid");
  const { leads, moveLeadStatus } = useLeadsStore();

  const viewSwitcher = (
    <ViewSwitcher
      current={view}
      onChange={setView}
      views={["grid", "kanban"]}
    />
  );

  if (view === "kanban") {
    return (
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2.5">
          <h1 className="text-base font-semibold text-zinc-900">Leads</h1>
          {viewSwitcher}
        </div>
        <div className="flex-1 overflow-hidden">
          <KanbanBoard<Lead>
            data={leads}
            stages={LEAD_STAGES}
            getStage={(lead) => lead.status}
            onMove={(leadId, newStage, _newIndex) =>
              moveLeadStatus(leadId, newStage as Lead["status"])
            }
            renderCard={(lead, isDragging) => (
              <LeadCard lead={lead} isDragging={isDragging} />
            )}
            stageColors={STAGE_COLORS}
            getStageSummary={(items) =>
              formatCurrency(items.reduce((s, l) => s + l.estimatedValue, 0))
            }
            onItemClick={onRowClick}
          />
        </div>
      </div>
    );
  }

  return <LeadsGrid onRowClick={onRowClick} toolbarExtra={viewSwitcher} />;
}
