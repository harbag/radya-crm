"use client";

import React, { useState } from "react";
import ViewSwitcher, { type ViewType } from "@/components/shared/view-switcher";
import LeadsGrid from "./leads-grid";
import LeadCard from "./lead-card";
import KanbanBoard from "@/components/shared/kanban-board";
import { useLeadList, useUpdateLead, type LeadRow } from "@/lib/queries/leads";
import { useCreateDeal } from "@/lib/queries/deals";
import { usePipelines, useStages } from "@/lib/queries/pipelines";
import {
  LEAD_STATUS_CONFIG,
  LEAD_SOURCE_CONFIG,
  formatCurrency,
  type Lead,
} from "@/lib/mock-data";
import type { LeadStatus, LeadSource } from "@/lib/types";
import type { FilterColumnDef } from "@/components/shared/filter-builder";
import { GridSkeleton, QueryError } from "@/components/shared/query-states";

function mapLeadRow(row: LeadRow): Lead {
  let status: LeadStatus = "new";
  if (row.status === "contacted") status = "contacted";
  else if (row.status === "qualified") status = "qualified";
  else if (row.status === "disqualified" || row.status === "converted")
    status = "unqualified";

  return {
    id: row.id,
    title: row.title,
    source: (row.lead_source as LeadSource) ?? "other",
    status,
    contactId: row.contact_id,
    companyId: row.company_id,
    estimatedValue: row.estimated_value ?? 0,
    notes: "",
    priority: row.priority ?? undefined,
    lastContactedAt: row.last_contacted_at ?? undefined,
    nextFollowUpAt: row.next_follow_up_at ?? undefined,
    isArchived: row.is_archived,
    convertedAt: row.converted_at ?? undefined,
    convertedDealId: row.converted_deal_id ?? undefined,
    ownerId: row.owner_id ?? undefined,
    createdAt: row.created_at,
    createdBy: row.created_by ?? "",
    lastModifiedAt: row.updated_at,
    lastModifiedBy: "",
  };
}

const FILTER_COLUMNS: FilterColumnDef[] = [
  { id: "title", label: "Title", dataType: "text" },
  {
    id: "source",
    label: "Source",
    dataType: "select",
    selectOptions: Object.entries(LEAD_SOURCE_CONFIG).map(([key, val]) => ({
      value: key,
      label: val.label,
    })),
  },
  {
    id: "status",
    label: "Status",
    dataType: "select",
    selectOptions: Object.entries(LEAD_STATUS_CONFIG).map(([key, val]) => ({
      value: key,
      label: val.label,
    })),
  },
  { id: "estimatedValue", label: "Est. Value", dataType: "number" },
  { id: "createdAt", label: "Created", dataType: "date" },
];

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
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [selectedStageId, setSelectedStageId] = useState("");
  const [convertValue, setConvertValue] = useState(0);
  const [convertTitle, setConvertTitle] = useState("");

  const { data: rows, isLoading, error, refetch } = useLeadList();
  const updateLead = useUpdateLead();
  const createDeal = useCreateDeal();
  const { data: pipelines } = usePipelines();
  const defaultPipeline = pipelines?.find((p) => p.is_default) ?? pipelines?.[0];
  const { data: stages } = useStages(defaultPipeline?.id ?? "");

  const leads: Lead[] = (rows ?? []).map(mapLeadRow);

  const viewSwitcher = (
    <ViewSwitcher
      current={view}
      onChange={setView}
      views={["grid", "kanban"]}
    />
  );

  function handleMoveStatus(leadId: string, newStatus: string) {
    const dbStatus =
      newStatus === "unqualified" ? "disqualified" : (newStatus as LeadRow["status"]);
    updateLead.mutate({ id: leadId, status: dbStatus });
  }

  function openConvertModal(lead: Lead) {
    setConvertingLead(lead);
    setConvertTitle(lead.title);
    setConvertValue(lead.estimatedValue);
    setSelectedStageId(stages?.[0]?.id ?? "");
  }

  async function handleConvert() {
    if (!convertingLead || !defaultPipeline || !selectedStageId) return;
    try {
      const deal = await createDeal.mutateAsync({
        title: convertTitle,
        pipeline_id: defaultPipeline.id,
        stage_id: selectedStageId,
        status: "open",
        value: convertValue,
        currency: "IDR",
        probability: 50,
        contact_id: convertingLead.contactId ?? null,
        company_id: convertingLead.companyId ?? null,
        owner_id: convertingLead.ownerId ?? null,
        expected_close_date: null,
        actual_close_date: null,
        lost_reason: null,
        lead_source: convertingLead.source,
        stage_changed_at: new Date().toISOString(),
        created_by: null,
      });
      await updateLead.mutateAsync({
        id: convertingLead.id,
        status: "converted",
        converted_at: new Date().toISOString(),
        converted_deal_id: deal.id,
      });
      setConvertingLead(null);
    } catch {
      // error is handled by React Query
    }
  }

  if (isLoading) return <GridSkeleton />;
  if (error) return <QueryError message={error.message} onRetry={() => refetch()} />;

  return (
    <>
      {/* Conversion modal */}
      {convertingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-base font-semibold text-zinc-900">
              Convert Lead to Deal
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-zinc-700">
                  Deal Title
                </label>
                <input
                  type="text"
                  value={convertTitle}
                  onChange={(e) => setConvertTitle(e.target.value)}
                  className="w-full rounded border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-700">
                  Deal Value (IDR)
                </label>
                <input
                  type="number"
                  value={convertValue}
                  onChange={(e) => setConvertValue(Number(e.target.value))}
                  className="w-full rounded border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-700">
                  Pipeline Stage
                </label>
                <select
                  value={selectedStageId}
                  onChange={(e) => setSelectedStageId(e.target.value)}
                  className="w-full rounded border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {(stages ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConvertingLead(null)}
                className="rounded px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConvert}
                disabled={createDeal.isPending || updateLead.isPending}
                className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {createDeal.isPending ? "Converting…" : "Convert to Deal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {view === "kanban" ? (
        <div className="flex h-full flex-col bg-background">
          <div className="flex items-center border-b border-zinc-200 px-3 py-2 sm:px-4 sm:py-2.5">
            <h1 className="mr-3 text-base font-semibold text-zinc-900">
              Leads
            </h1>
            {viewSwitcher}
          </div>
          <div className="flex-1 overflow-hidden">
            <KanbanBoard<Lead>
              data={leads}
              stages={LEAD_STAGES}
              getStage={(lead) => lead.status}
              onMove={(leadId, newStage) =>
                handleMoveStatus(leadId, newStage)
              }
              renderCard={(lead, isDragging) => (
                <div>
                  <LeadCard lead={lead} isDragging={isDragging} />
                  {lead.status !== "unqualified" && (
                    <button
                      className="mt-1 w-full rounded px-2 py-1 text-[10px] font-medium text-indigo-600 hover:bg-indigo-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        openConvertModal(lead);
                      }}
                    >
                      Convert to Deal →
                    </button>
                  )}
                </div>
              )}
              stageColors={STAGE_COLORS}
              getStageSummary={(items) =>
                formatCurrency(items.reduce((s, l) => s + l.estimatedValue, 0))
              }
              onItemClick={onRowClick}
              filterColumns={FILTER_COLUMNS}
            />
          </div>
        </div>
      ) : (
        <LeadsGrid
          onRowClick={onRowClick}
          titleExtra={viewSwitcher}
          toolbarExtra={
            undefined
          }
        />
      )}
    </>
  );
}
