"use client";

import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Target } from "lucide-react";
import DataGrid, { type FilterOption } from "@/components/shared/data-grid";
import {
  EditableTextCell,
  createStatusBadgeCell,
  DateCell,
  CurrencyCell,
  createRelationCell,
} from "@/components/shared/grid-cells";
import { useLeadsStore } from "@/store/use-leads-store";
import { useContactsStore } from "@/store/use-contacts-store";
import { useCompaniesStore } from "@/store/use-companies-store";
import {
  LEAD_STATUS_CONFIG,
  LEAD_SOURCE_CONFIG,
  type Lead,
} from "@/lib/mock-data";

const COLUMN_WIDTHS: Record<string, number> = {
  select: 40,
  rowNum: 40,
  title: 200,
  source: 120,
  status: 120,
  contactId: 150,
  companyId: 150,
  estimatedValue: 140,
  notes: 200,
  createdAt: 110,
  actions: 44,
};

const StatusCell = createStatusBadgeCell<Lead>(LEAD_STATUS_CONFIG, "status");
const SourceCell = createStatusBadgeCell<Lead>(LEAD_SOURCE_CONFIG, "source");

export default function LeadsGrid({
  onRowClick,
  toolbarExtra,
}: {
  onRowClick?: (row: Lead) => void;
  toolbarExtra?: React.ReactNode;
}) {
  const { leads, addLead, updateLead, deleteLeads } = useLeadsStore();
  const { contacts } = useContactsStore();
  const { companies } = useCompaniesStore();

  const ContactCell = createRelationCell<Lead>(
    () => contacts.map((c) => ({ id: c.id, name: c.name })),
    "contactId"
  );
  const CompanyCell = createRelationCell<Lead>(
    () => companies.map((c) => ({ id: c.id, name: c.name })),
    "companyId"
  );

  const columns: ColumnDef<Lead, any>[] = [
    {
      accessorKey: "title",
      header: "Title",
      size: COLUMN_WIDTHS.title,
      cell: EditableTextCell,
      filterFn: "includesString",
    },
    {
      accessorKey: "source",
      header: "Source",
      size: COLUMN_WIDTHS.source,
      cell: SourceCell,
      filterFn: "equals",
    },
    {
      accessorKey: "status",
      header: "Status",
      size: COLUMN_WIDTHS.status,
      cell: StatusCell,
      filterFn: "equals",
    },
    {
      accessorKey: "contactId",
      header: "Contact",
      size: COLUMN_WIDTHS.contactId,
      cell: ContactCell,
    },
    {
      accessorKey: "companyId",
      header: "Company",
      size: COLUMN_WIDTHS.companyId,
      cell: CompanyCell,
    },
    {
      accessorKey: "estimatedValue",
      header: "Est. Value",
      size: COLUMN_WIDTHS.estimatedValue,
      cell: CurrencyCell,
      enableColumnFilter: false,
    },
    {
      accessorKey: "notes",
      header: "Notes",
      size: COLUMN_WIDTHS.notes,
      cell: EditableTextCell,
      enableColumnFilter: false,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      size: COLUMN_WIDTHS.createdAt,
      cell: DateCell,
      enableColumnFilter: false,
    },
  ];

  const filterOptions: FilterOption[] = [
    {
      id: "status",
      label: "All Status",
      options: Object.entries(LEAD_STATUS_CONFIG).map(([key, val]) => ({
        value: key,
        label: val.label,
      })),
    },
    {
      id: "source",
      label: "All Sources",
      options: Object.entries(LEAD_SOURCE_CONFIG).map(([key, val]) => ({
        value: key,
        label: val.label,
      })),
    },
  ];

  return (
    <DataGrid<Lead>
      data={leads}
      columns={columns}
      columnWidths={COLUMN_WIDTHS}
      entityName="Leads"
      entityIcon={Target}
      onAdd={() =>
        addLead({
          title: "",
          source: "other",
          status: "new",
          contactId: null,
          companyId: null,
          estimatedValue: 0,
          notes: "",
        })
      }
      onUpdate={(id, updates) => updateLead(id, updates as Partial<Lead>)}
      onDelete={deleteLeads}
      onRowClick={onRowClick}
      filterOptions={filterOptions}
      toolbarExtra={toolbarExtra}
      addLabel="Add Lead"
    />
  );
}
