"use client";

import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2 } from "lucide-react";
import DataGrid from "@/components/shared/data-grid";
import { EditableTextCell, LongTextCell, DateCell, DateTimeCell, createAvatarNameCell } from "@/components/shared/grid-cells";
import { useCompaniesStore } from "@/store/use-companies-store";
import type { Company } from "@/lib/mock-data";

function getCompanyLogoUrl(company: Company): string | undefined {
  if (company.logoUrl) return company.logoUrl;
  if (!company.website) return undefined;
  try {
    const domain = new URL(company.website).hostname;
    return `https://logo.clearbit.com/${domain}`;
  } catch {
    return undefined;
  }
}

const CompanyNameCell = createAvatarNameCell<Company>(
  getCompanyLogoUrl,
  "bg-emerald-100",
  "text-emerald-700"
);

const COLUMN_WIDTHS: Record<string, number> = {
  select: 40,
  rowNum: 40,
  name: 180,
  industry: 140,
  website: 180,
  phone: 140,
  address: 200,
  notes: 220,
  createdAt: 130,
  createdBy: 130,
  lastModifiedAt: 150,
  lastModifiedBy: 130,
  actions: 44,
};

const AUDIT_HIDDEN_COLUMNS = ["createdAt", "createdBy", "lastModifiedAt", "lastModifiedBy"];

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
      cell: CompanyNameCell,
      filterFn: "includesString",
      meta: { cellType: "text" as const, dataType: "text" as const },
    },
    {
      accessorKey: "industry",
      header: "Industry",
      size: COLUMN_WIDTHS.industry,
      cell: EditableTextCell,
      filterFn: "includesString",
      meta: { cellType: "text" as const, dataType: "text" as const },
    },
    {
      accessorKey: "website",
      header: "Website",
      size: COLUMN_WIDTHS.website,
      cell: EditableTextCell,
      enableColumnFilter: false,
      meta: { cellType: "text" as const, dataType: "text" as const },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      size: COLUMN_WIDTHS.phone,
      cell: EditableTextCell,
      enableColumnFilter: false,
      meta: { cellType: "text" as const, dataType: "text" as const },
    },
    {
      accessorKey: "address",
      header: "Address",
      size: COLUMN_WIDTHS.address,
      cell: LongTextCell,
      enableColumnFilter: false,
      meta: { cellType: "longtext" as const, dataType: "text" as const },
    },
    {
      accessorKey: "notes",
      header: "Notes",
      size: COLUMN_WIDTHS.notes,
      cell: LongTextCell,
      enableColumnFilter: false,
      meta: { cellType: "longtext" as const, dataType: "text" as const },
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
      cell: ({ getValue }: { getValue: () => string }) => (
        <div className="flex h-full w-full items-center px-2 text-sm text-muted-foreground">{getValue() || "\u2014"}</div>
      ),
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
      cell: ({ getValue }: { getValue: () => string }) => (
        <div className="flex h-full w-full items-center px-2 text-sm text-muted-foreground">{getValue() || "\u2014"}</div>
      ),
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
      defaultHiddenColumns={AUDIT_HIDDEN_COLUMNS}
    />
  );
}
