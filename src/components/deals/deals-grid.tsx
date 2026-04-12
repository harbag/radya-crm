"use client";

import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { KanbanSquare } from "lucide-react";
import DataGrid from "@/components/shared/data-grid";
import {
  EditableTextCell,
  DateCell,
  DateTimeCell,
  CurrencyCell,
  createRelationCell,
} from "@/components/shared/grid-cells";
import { createAttachmentCell } from "@/components/shared/grid-cells-attachment";
import {
  useDealList,
  useCreateDeal,
  useUpdateDeal,
  useArchiveDeal,
  type DealRow,
} from "@/lib/queries/deals";
import { useContactList } from "@/lib/queries/contacts";
import { useCompanyList } from "@/lib/queries/companies";
import { usePipelines, useStages } from "@/lib/queries/pipelines";
import type { Deal } from "@/lib/types";
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

function dealUpdateFields(updates: Partial<Deal>): Partial<DealRow> {
  const fields: Partial<DealRow> = {};
  if (updates.title !== undefined) fields.title = updates.title as string;
  if (updates.value !== undefined) fields.value = updates.value as number;
  if (updates.contactId !== undefined)
    fields.contact_id = updates.contactId as string | null;
  if (updates.companyId !== undefined)
    fields.company_id = updates.companyId as string | null;
  if (updates.probability !== undefined)
    fields.probability = updates.probability as number;
  if (updates.expectedCloseDate !== undefined)
    fields.expected_close_date = updates.expectedCloseDate as string | null;
  if (updates.stageId !== undefined)
    fields.stage_id = updates.stageId as string | null;
  return fields;
}

const AttachmentCell = createAttachmentCell<Deal>("deal");

const COLUMN_WIDTHS: Record<string, number> = {
  select: 40,
  rowNum: 40,
  title: 200,
  value: 140,
  contactId: 150,
  companyId: 150,
  probability: 90,
  expectedCloseDate: 120,
  attachments: 100,
  createdAt: 130,
  createdBy: 130,
  lastModifiedAt: 150,
  lastModifiedBy: 130,
  actions: 44,
};

const AUDIT_HIDDEN_COLUMNS = [
  "createdAt",
  "createdBy",
  "lastModifiedAt",
  "lastModifiedBy",
];

export default function DealsGrid({
  onRowClick,
  titleExtra,
  toolbarExtra,
}: {
  onRowClick?: (row: Deal) => void;
  titleExtra?: React.ReactNode;
  toolbarExtra?: React.ReactNode;
}) {
  const {
    data: rows,
    isLoading,
    error,
    refetch,
  } = useDealList();
  const { data: contactRows } = useContactList();
  const { data: companyRows } = useCompanyList();
  const { data: pipelines } = usePipelines();
  const defaultPipeline =
    pipelines?.find((p) => p.is_default) ?? pipelines?.[0];
  const { data: stages } = useStages(defaultPipeline?.id ?? "");

  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const archiveDeal = useArchiveDeal();

  const deals: Deal[] = (rows ?? []).map(mapDealRow);
  const contactOptions = (contactRows ?? []).map((c) => ({
    id: c.id,
    name: [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email || c.id,
  }));
  const companyOptions = (companyRows ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const ContactCell = createRelationCell<Deal>(
    () => contactOptions,
    "contactId"
  );
  const CompanyCell = createRelationCell<Deal>(
    () => companyOptions,
    "companyId"
  );

  const columns: ColumnDef<Deal, unknown>[] = [
    {
      accessorKey: "title",
      header: "Title",
      size: COLUMN_WIDTHS.title,
      cell: EditableTextCell,
      filterFn: "includesString",
      meta: { cellType: "text" as const, dataType: "text" as const },
    },
    {
      accessorKey: "value",
      header: "Value",
      size: COLUMN_WIDTHS.value,
      cell: CurrencyCell,
      enableColumnFilter: false,
      meta: { cellType: "readonly" as const, dataType: "number" as const },
    },
    {
      accessorKey: "contactId",
      header: "Contact",
      size: COLUMN_WIDTHS.contactId,
      cell: ContactCell,
      meta: { cellType: "dropdown" as const },
    },
    {
      accessorKey: "companyId",
      header: "Company",
      size: COLUMN_WIDTHS.companyId,
      cell: CompanyCell,
      meta: { cellType: "dropdown" as const },
    },
    {
      accessorKey: "probability",
      header: "Prob. %",
      size: COLUMN_WIDTHS.probability,
      cell: EditableTextCell,
      enableColumnFilter: false,
      meta: { cellType: "text" as const, dataType: "number" as const },
    },
    {
      accessorKey: "expectedCloseDate",
      header: "Close Date",
      size: COLUMN_WIDTHS.expectedCloseDate,
      cell: DateCell,
      enableColumnFilter: false,
      meta: { cellType: "readonly" as const, dataType: "date" as const },
    },
    {
      id: "attachments",
      header: "Files",
      size: COLUMN_WIDTHS.attachments,
      cell: AttachmentCell,
      enableSorting: false,
      enableColumnFilter: false,
      meta: { cellType: "readonly" as const },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      size: COLUMN_WIDTHS.createdAt,
      cell: DateTimeCell,
      enableColumnFilter: false,
      meta: { cellType: "readonly" as const, dataType: "date" as const },
    },
    {
      accessorKey: "createdBy",
      header: "Created By",
      size: COLUMN_WIDTHS.createdBy,
      enableColumnFilter: false,
      meta: { cellType: "readonly" as const, dataType: "text" as const },
      cell: (cellCtx) => {
        const val = cellCtx.getValue() as string;
        return <div className="flex h-full w-full items-center px-2 text-sm text-muted-foreground">{val || "\u2014"}</div>;
      },
    },
    {
      accessorKey: "lastModifiedAt",
      header: "Modified",
      size: COLUMN_WIDTHS.lastModifiedAt,
      cell: DateTimeCell,
      enableColumnFilter: false,
      meta: { cellType: "readonly" as const, dataType: "date" as const },
    },
    {
      accessorKey: "lastModifiedBy",
      header: "Modified By",
      size: COLUMN_WIDTHS.lastModifiedBy,
      enableColumnFilter: false,
      meta: { cellType: "readonly" as const, dataType: "text" as const },
      cell: (cellCtx) => {
        const val = cellCtx.getValue() as string;
        return <div className="flex h-full w-full items-center px-2 text-sm text-muted-foreground">{val || "\u2014"}</div>;
      },
    },
  ];

  if (isLoading) return <GridSkeleton />;
  if (error)
    return <QueryError message={error.message} onRetry={() => refetch()} />;

  return (
    <DataGrid<Deal>
      data={deals}
      columns={columns}
      columnWidths={COLUMN_WIDTHS}
      entityName="Deals"
      entityIcon={KanbanSquare}
      onAdd={() =>
        createDeal.mutate({
          title: "",
          pipeline_id: defaultPipeline?.id ?? null,
          stage_id: stages?.[0]?.id ?? null,
          status: "open",
          value: 0,
          currency: "IDR",
          probability: 50,
          contact_id: null,
          company_id: null,
          owner_id: null,
          expected_close_date: null,
          actual_close_date: null,
          lost_reason: null,
          lead_source: null,
          stage_changed_at: new Date().toISOString(),
          created_by: null,
        })
      }
      onUpdate={(id, updates) =>
        updateDeal.mutate({ id, ...dealUpdateFields(updates) })
      }
      onDelete={(ids) => ids.forEach((id) => archiveDeal.mutate(id))}
      onRowClick={onRowClick}
      titleExtra={titleExtra}
      toolbarExtra={toolbarExtra}
      addLabel="Add Deal"
      defaultHiddenColumns={AUDIT_HIDDEN_COLUMNS}
    />
  );
}
