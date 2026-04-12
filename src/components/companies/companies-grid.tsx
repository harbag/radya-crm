"use client";

import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2 } from "lucide-react";
import DataGrid from "@/components/shared/data-grid";
import {
  EditableTextCell,
  LongTextCell,
  DateTimeCell,
  createAvatarNameCell,
} from "@/components/shared/grid-cells";
import {
  useCompanyList,
  useCreateCompany,
  useUpdateCompany,
  useArchiveCompany,
  type CompanyRow,
} from "@/lib/queries/companies";
import type { Company } from "@/lib/types";
import { GridSkeleton, QueryError } from "@/components/shared/query-states";

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

function mapCompanyRow(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry ?? "",
    website: row.website ?? "",
    phone: row.phone ?? "",
    address: [row.address_city, row.address_province]
      .filter(Boolean)
      .join(", "),
    notes: "",
    logoUrl: row.logo_url ?? undefined,
    companySize: row.company_size ?? undefined,
    emailDomain: row.email_domain ?? undefined,
    addressCity: row.address_city ?? undefined,
    addressProvince: row.address_province ?? undefined,
    addressCountry: row.address_country ?? undefined,
    ownerId: row.owner_id ?? undefined,
    annualRevenue: row.annual_revenue ?? undefined,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    createdBy: row.created_by ?? "",
    lastModifiedAt: row.updated_at,
    lastModifiedBy: "",
  };
}

function companyUpdateFields(
  updates: Partial<Company>
): Partial<CompanyRow> {
  const fields: Partial<CompanyRow> = {};
  if (updates.name !== undefined) fields.name = updates.name as string;
  if (updates.industry !== undefined)
    fields.industry = updates.industry as string;
  if (updates.website !== undefined) fields.website = updates.website as string;
  if (updates.phone !== undefined) fields.phone = updates.phone as string;
  if (updates.logoUrl !== undefined)
    fields.logo_url = updates.logoUrl as string | null;
  if (updates.addressCity !== undefined)
    fields.address_city = updates.addressCity as string | null;
  if (updates.addressProvince !== undefined)
    fields.address_province = updates.addressProvince as string | null;
  return fields;
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

export default function CompaniesGrid({
  onRowClick,
  toolbarExtra,
}: {
  onRowClick?: (row: Company) => void;
  toolbarExtra?: React.ReactNode;
}) {
  const {
    data: rows,
    isLoading,
    error,
    refetch,
  } = useCompanyList();
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const archiveCompany = useArchiveCompany();

  const companies: Company[] = (rows ?? []).map(mapCompanyRow);

  const columns: ColumnDef<Company, unknown>[] = [
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
    <DataGrid<Company>
      data={companies}
      columns={columns}
      columnWidths={COLUMN_WIDTHS}
      entityName="Companies"
      entityIcon={Building2}
      onAdd={() =>
        createCompany.mutate({
          name: "",
          industry: null,
          company_size: null,
          website: null,
          phone: null,
          email_domain: null,
          address_city: null,
          address_province: null,
          address_country: "Indonesia",
          logo_url: null,
          owner_id: null,
          annual_revenue: null,
          created_by: null,
        })
      }
      onUpdate={(id, updates) =>
        updateCompany.mutate({ id, ...companyUpdateFields(updates) })
      }
      onDelete={(ids) => ids.forEach((id) => archiveCompany.mutate(id))}
      onRowClick={onRowClick}
      toolbarExtra={toolbarExtra}
      addLabel="Add Company"
      defaultHiddenColumns={AUDIT_HIDDEN_COLUMNS}
    />
  );
}
