"use client";

import React, { useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import {
  useDealList,
  useUpdateDeal,
  type DealRow,
} from "@/lib/queries/deals";
import { usePipelines, useStages } from "@/lib/queries/pipelines";
import type { Deal } from "@/lib/types";
import { formatCurrency } from "@/lib/mock-data";
import KanbanColumn from "./kanban-column";
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

export default function DealsKanban({
  titleExtra,
}: {
  titleExtra?: React.ReactNode;
}) {
  const { data: dealRows, isLoading, error, refetch } = useDealList();
  const { data: pipelines } = usePipelines();
  const defaultPipeline =
    pipelines?.find((p) => p.is_default) ?? pipelines?.[0];
  const { data: stages } = useStages(defaultPipeline?.id ?? "");
  const updateDeal = useUpdateDeal();

  const [pendingWonDeal, setPendingWonDeal] = useState<{
    id: string;
    stageId: string;
  } | null>(null);
  const [pendingLostDeal, setPendingLostDeal] = useState<{
    id: string;
    stageId: string;
  } | null>(null);
  const [wonCloseDate, setWonCloseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [lostReason, setLostReason] = useState("");

  if (isLoading) return <GridSkeleton />;
  if (error)
    return <QueryError message={error.message} onRetry={() => refetch()} />;

  const deals = (dealRows ?? []).map(mapDealRow);

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const { draggableId, source, destination } = result;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const destStageId = destination.droppableId;
    const destStage = stages?.find((s) => s.id === destStageId);

    if (destStage?.is_won_stage) {
      setPendingWonDeal({ id: draggableId, stageId: destStageId });
      setWonCloseDate(new Date().toISOString().split("T")[0]);
      return;
    }
    if (destStage?.is_lost_stage) {
      setPendingLostDeal({ id: draggableId, stageId: destStageId });
      setLostReason("");
      return;
    }

    updateDeal.mutate({
      id: draggableId,
      stage_id: destStageId,
      stage_changed_at: new Date().toISOString(),
    });
  }

  const openDeals = deals.filter(
    (d) => d.dealStatus !== "won" && d.dealStatus !== "lost"
  );
  const totalPipeline = openDeals.reduce((s, d) => s + d.value, 0);
  const closedWon = deals
    .filter((d) => d.dealStatus === "won")
    .reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Won modal */}
      {pendingWonDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-80 rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-base font-semibold text-zinc-900">
              Mark as Won
            </h3>
            <label className="mb-1 block text-sm text-zinc-700">
              Actual close date
            </label>
            <input
              type="date"
              value={wonCloseDate}
              onChange={(e) => setWonCloseDate(e.target.value)}
              className="mb-4 w-full rounded border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPendingWonDeal(null)}
                className="rounded px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!pendingWonDeal) return;
                  updateDeal.mutate({
                    id: pendingWonDeal.id,
                    stage_id: pendingWonDeal.stageId,
                    status: "won",
                    actual_close_date: wonCloseDate,
                    stage_changed_at: new Date().toISOString(),
                  });
                  setPendingWonDeal(null);
                }}
                className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Confirm Won
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lost modal */}
      {pendingLostDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-80 rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-base font-semibold text-zinc-900">
              Mark as Lost
            </h3>
            <label className="mb-1 block text-sm text-zinc-700">
              Reason for losing
            </label>
            <input
              type="text"
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              placeholder="e.g. Budget constraints"
              className="mb-4 w-full rounded border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPendingLostDeal(null)}
                className="rounded px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!pendingLostDeal) return;
                  updateDeal.mutate({
                    id: pendingLostDeal.id,
                    stage_id: pendingLostDeal.stageId,
                    status: "lost",
                    lost_reason: lostReason,
                    stage_changed_at: new Date().toISOString(),
                  });
                  setPendingLostDeal(null);
                }}
                className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Confirm Lost
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-2.5">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-zinc-900">
            Deals Pipeline
          </h1>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
            {deals.length}
          </span>
          {titleExtra && <div className="ml-2">{titleExtra}</div>}
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
            <span className="font-semibold text-zinc-800">
              {openDeals.length}
            </span>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-3 p-5" style={{ minWidth: "max-content" }}>
            {(stages ?? []).map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                deals={deals.filter((d) => d.stageId === stage.id)}
              />
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
