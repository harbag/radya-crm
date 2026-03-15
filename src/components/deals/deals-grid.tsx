"use client";

import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { KanbanSquare } from "lucide-react";
import DataGrid, { type FilterOption } from "@/components/shared/data-grid";
import {
  EditableTextCell,
  createStatusBadgeCell,
  DateCell,
  CurrencyCell,
  createRelationCell,
} from "@/components/shared/grid-cells";
import { useDealsStore } from "@/store/use-deals-store";
import { useContactsStore } from "@/store/use-contacts-store";
import { useCompaniesStore } from "@/store/use-companies-store";
import { DEAL_STAGE_CONFIG, type Deal } from "@/lib/mock-data";

const COLUMN_WIDTHS: Record<string, number> = {
  select: 40,
  rowNum: 40,
  title: 200,
  value: 140,
  contactId: 150,
  companyId: 150,
  stage: 120,
  probability: 90,
  expectedCloseDate: 120,
  notes: 200,
  createdAt: 110,
  actions: 44,
};

const StageCell = createStatusBadgeCell<Deal>(DEAL_STAGE_CONFIG, "stage");

export default function DealsGrid({
  onRowClick,
  toolbarExtra,
}: {
  onRowClick?: (row: Deal) => void;
  toolbarExtra?: React.ReactNode;
}) {
  const { deals, addDeal, updateDeal, deleteDeals } = useDealsStore();
  const { contacts } = useContactsStore();
  const { companies } = useCompaniesStore();

  const ContactCell = createRelationCell<Deal>(
    () => contacts.map((c) => ({ id: c.id, name: c.name })),
    "contactId"
  );
  const CompanyCell = createRelationCell<Deal>(
    () => companies.map((c) => ({ id: c.id, name: c.name })),
    "companyId"
  );

  const columns: ColumnDef<Deal, any>[] = [
    {
      accessorKey: "title",
      header: "Title",
      size: COLUMN_WIDTHS.title,
      cell: EditableTextCell,
      filterFn: "includesString",
    },
    {
      accessorKey: "value",
      header: "Value",
      size: COLUMN_WIDTHS.value,
      cell: CurrencyCell,
      enableColumnFilter: false,
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
      accessorKey: "stage",
      header: "Stage",
      size: COLUMN_WIDTHS.stage,
      cell: StageCell,
      filterFn: "equals",
    },
    {
      accessorKey: "probability",
      header: "Prob. %",
      size: COLUMN_WIDTHS.probability,
      cell: EditableTextCell,
      enableColumnFilter: false,
    },
    {
      accessorKey: "expectedCloseDate",
      header: "Close Date",
      size: COLUMN_WIDTHS.expectedCloseDate,
      cell: DateCell,
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
      id: "stage",
      label: "All Stages",
      options: Object.entries(DEAL_STAGE_CONFIG).map(([key, val]) => ({
        value: key,
        label: val.label,
      })),
    },
  ];

  return (
    <DataGrid<Deal>
      data={deals}
      columns={columns}
      columnWidths={COLUMN_WIDTHS}
      entityName="Deals"
      entityIcon={KanbanSquare}
      onAdd={() =>
        addDeal({
          title: "",
          value: 0,
          contactId: "",
          companyId: null,
          stage: "prospecting",
          probability: 20,
          expectedCloseDate: new Date().toISOString().split("T")[0],
          notes: "",
        })
      }
      onUpdate={(id, updates) => updateDeal(id, updates as Partial<Deal>)}
      onDelete={deleteDeals}
      onRowClick={onRowClick}
      filterOptions={filterOptions}
      toolbarExtra={toolbarExtra}
      addLabel="Add Deal"
    />
  );
}
