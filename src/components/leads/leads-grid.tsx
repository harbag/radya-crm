"use client";

import React from "react";
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import { Target } from "lucide-react";
import DataGrid from "@/components/shared/data-grid";
import {
  EditableTextCell,
  LongTextCell,
  createStatusBadgeCell,
  DateTimeCell,
  CurrencyCell,
  createRelationCell,
} from "@/components/shared/grid-cells";
import {
  useLeadList,
  useCreateLead,
  useUpdateLead,
  useArchiveLead,
  type LeadRow,
} from "@/lib/queries/leads";
import { useContactList } from "@/lib/queries/contacts";
import { useCompanyList } from "@/lib/queries/companies";
import {
  LEAD_STATUS_CONFIG,
  LEAD_SOURCE_CONFIG,
  type Lead,
} from "@/lib/mock-data";
import type { LeadStatus, LeadSource } from "@/lib/types";
import { GridSkeleton, QueryError } from "@/components/shared/query-states";
import { cn } from "@/lib/utils";

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

function leadUpdateFields(updates: Partial<Lead>): Partial<LeadRow> {
  const fields: Partial<LeadRow> = {};
  if (updates.title !== undefined) fields.title = updates.title as string;
  if (updates.source !== undefined) fields.lead_source = updates.source as string;
  if (updates.status !== undefined) {
    const s = updates.status;
    fields.status =
      s === "unqualified"
        ? "disqualified"
        : (s as LeadRow["status"]);
  }
  if (updates.contactId !== undefined)
    fields.contact_id = updates.contactId as string | null;
  if (updates.companyId !== undefined)
    fields.company_id = updates.companyId as string | null;
  if (updates.estimatedValue !== undefined)
    fields.estimated_value = updates.estimatedValue as number;
  if (updates.nextFollowUpAt !== undefined)
    fields.next_follow_up_at = updates.nextFollowUpAt as string | null;
  return fields;
}

function isOverdue(row: Lead): boolean {
  if (!row.nextFollowUpAt) return false;
  if (row.status !== "new" && row.status !== "contacted") return false;
  return new Date(row.nextFollowUpAt) < new Date();
}

const COLUMN_WIDTHS: Record<string, number> = {
  select: 40,
  rowNum: 40,
  title: 200,
  source: 120,
  status: 120,
  followUp: 130,
  contactId: 150,
  companyId: 150,
  estimatedValue: 140,
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

const StatusCell = createStatusBadgeCell<Lead>(LEAD_STATUS_CONFIG, "status");
const SourceCell = createStatusBadgeCell<Lead>(LEAD_SOURCE_CONFIG, "source");

function FollowUpCell({ row }: CellContext<Lead, unknown>) {
  const lead = row.original;
  if (!lead.nextFollowUpAt) return <div className="flex h-full w-full items-center px-2 text-sm text-zinc-400">&mdash;</div>;
  const overdue = isOverdue(lead);
  return (
    <div className={cn("flex h-full w-full items-center px-2 text-sm", overdue ? "text-red-600 font-medium" : "text-zinc-600")}>
      {overdue && (
        <span className="mr-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
          Overdue
        </span>
      )}
      {new Date(lead.nextFollowUpAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
    </div>
  );
}

export default function LeadsGrid({
  onRowClick,
  titleExtra,
  toolbarExtra,
}: {
  onRowClick?: (row: Lead) => void;
  titleExtra?: React.ReactNode;
  toolbarExtra?: React.ReactNode;
}) {
  const {
    data: rows,
    isLoading,
    error,
    refetch,
  } = useLeadList();
  const { data: contactRows } = useContactList();
  const { data: companyRows } = useCompanyList();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const archiveLead = useArchiveLead();

  const leads: Lead[] = (rows ?? []).map(mapLeadRow);
  const contactOptions = (contactRows ?? []).map((c) => ({
    id: c.id,
    name: [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email || c.id,
  }));
  const companyOptions = (companyRows ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const ContactCell = createRelationCell<Lead>(
    () => contactOptions,
    "contactId"
  );
  const CompanyCell = createRelationCell<Lead>(
    () => companyOptions,
    "companyId"
  );

  const sourceOptions = Object.entries(LEAD_SOURCE_CONFIG).map(([key, val]) => ({
    value: key,
    label: val.label,
  }));
  const statusOptions = Object.entries(LEAD_STATUS_CONFIG).map(([key, val]) => ({
    value: key,
    label: val.label,
  }));

  const columns: ColumnDef<Lead, unknown>[] = [
    {
      accessorKey: "title",
      header: "Title",
      size: COLUMN_WIDTHS.title,
      cell: EditableTextCell,
      filterFn: "includesString",
      meta: { cellType: "text" as const, dataType: "text" as const },
    },
    {
      accessorKey: "source",
      header: "Source",
      size: COLUMN_WIDTHS.source,
      cell: SourceCell,
      filterFn: "equals",
      meta: {
        cellType: "dropdown" as const,
        dataType: "select" as const,
        selectOptions: sourceOptions,
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      size: COLUMN_WIDTHS.status,
      cell: StatusCell,
      filterFn: "equals",
      meta: {
        cellType: "dropdown" as const,
        dataType: "select" as const,
        selectOptions: statusOptions,
      },
    },
    {
      id: "followUp",
      accessorKey: "nextFollowUpAt",
      header: "Follow-up",
      size: COLUMN_WIDTHS.followUp,
      cell: FollowUpCell,
      enableColumnFilter: false,
      meta: { cellType: "readonly" as const },
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
      accessorKey: "estimatedValue",
      header: "Est. Value",
      size: COLUMN_WIDTHS.estimatedValue,
      cell: CurrencyCell,
      enableColumnFilter: false,
      meta: { cellType: "readonly" as const, dataType: "number" as const },
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
    <DataGrid<Lead>
      data={leads}
      columns={columns}
      columnWidths={COLUMN_WIDTHS}
      entityName="Leads"
      entityIcon={Target}
      onAdd={() =>
        createLead.mutate({
          title: "",
          status: "new",
          contact_id: null,
          company_id: null,
          contact_name: null,
          contact_phone: null,
          contact_email: null,
          lead_source: "other",
          estimated_value: null,
          owner_id: null,
          priority: null,
          last_contacted_at: null,
          next_follow_up_at: null,
          converted_at: null,
          converted_deal_id: null,
          created_by: null,
        })
      }
      onUpdate={(id, updates) =>
        updateLead.mutate({ id, ...leadUpdateFields(updates) })
      }
      onDelete={(ids) => ids.forEach((id) => archiveLead.mutate(id))}
      onRowClick={onRowClick}
      titleExtra={titleExtra}
      toolbarExtra={toolbarExtra}
      addLabel="Add Lead"
      defaultHiddenColumns={AUDIT_HIDDEN_COLUMNS}
    />
  );
}
