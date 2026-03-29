"use client";

import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2 } from "lucide-react";
import DataGrid from "@/components/shared/data-grid";
import { EditableTextCell, DateCell } from "@/components/shared/grid-cells";
import { useCompaniesStore } from "@/store/use-companies-store";
import type { Company } from "@/lib/mock-data";

const COLUMN_WIDTHS: Record<string, number> = {
  select: 40,
  rowNum: 40,
  name: 180,
  industry: 140,
  website: 180,
  phone: 140,
  address: 200,
  notes: 220,
  createdAt: 110,
  actions: 44,
};

export default function CompaniesGrid({
  onRowClick,
  toolbarExtra,
}: {
  onRowClick?: (row: Company) => void;
  toolbarExtra?: React.ReactNode;
}) {
  const { companies, addCompany, updateCompany, deleteCompanies } =
    useCompaniesStore();

  const columns: ColumnDef<Company, any>[] = [
    {
      accessorKey: "name",
      header: "Name",
      size: COLUMN_WIDTHS.name,
      cell: EditableTextCell,
      filterFn: "includesString",
      meta: { cellType: "text" as const },
    },
    {
      accessorKey: "industry",
      header: "Industry",
      size: COLUMN_WIDTHS.industry,
      cell: EditableTextCell,
      filterFn: "includesString",
      meta: { cellType: "text" as const },
    },
    {
      accessorKey: "website",
      header: "Website",
      size: COLUMN_WIDTHS.website,
      cell: EditableTextCell,
      enableColumnFilter: false,
      meta: { cellType: "text" as const },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      size: COLUMN_WIDTHS.phone,
      cell: EditableTextCell,
      enableColumnFilter: false,
      meta: { cellType: "text" as const },
    },
    {
      accessorKey: "address",
      header: "Address",
      size: COLUMN_WIDTHS.address,
      cell: EditableTextCell,
      enableColumnFilter: false,
      meta: { cellType: "text" as const },
    },
    {
      accessorKey: "notes",
      header: "Notes",
      size: COLUMN_WIDTHS.notes,
      cell: EditableTextCell,
      enableColumnFilter: false,
      meta: { cellType: "text" as const },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      size: COLUMN_WIDTHS.createdAt,
      cell: DateCell,
      enableColumnFilter: false,
      meta: { cellType: "readonly" as const },
    },
  ];

  return (
    <DataGrid<Company>
      data={companies}
      columns={columns}
      columnWidths={COLUMN_WIDTHS}
      entityName="Companies"
      entityIcon={Building2}
      onAdd={() =>
        addCompany({
          name: "",
          industry: "",
          website: "",
          phone: "",
          address: "",
          notes: "",
        })
      }
      onUpdate={(id, updates) =>
        updateCompany(id, updates as Partial<Company>)
      }
      onDelete={deleteCompanies}
      onRowClick={onRowClick}
      toolbarExtra={toolbarExtra}
      addLabel="Add Company"
    />
  );
}
