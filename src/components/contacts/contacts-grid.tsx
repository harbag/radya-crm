"use client";

import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Users } from "lucide-react";
import DataGrid from "@/components/shared/data-grid";
import {
  EditableTextCell,
  createAvatarNameCell,
  DateTimeCell,
  createRelationCell,
} from "@/components/shared/grid-cells";
import {
  useContactList,
  useCreateContact,
  useUpdateContact,
  useArchiveContact,
  type ContactRow,
} from "@/lib/queries/contacts";
import { useCompanyList } from "@/lib/queries/companies";
import type { Contact } from "@/lib/types";
import { GridSkeleton, QueryError } from "@/components/shared/query-states";

function mapContactRow(row: ContactRow): Contact {
  return {
    id: row.id,
    name: [row.first_name, row.last_name].filter(Boolean).join(" ") || "",
    email: row.email ?? "",
    phone: row.phone_primary ?? "",
    jobTitle: row.job_title ?? "",
    companyId: row.company_id,
    status: "lead",
    notes: "",
    linkedinUrl: row.linkedin_url ?? undefined,
    profileImageUrl: row.avatar_url ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    ownerId: row.owner_id ?? undefined,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    createdBy: row.created_by ?? "",
    lastModifiedAt: row.updated_at,
    lastModifiedBy: "",
  };
}

function contactUpdateFields(
  updates: Partial<Contact>
): Partial<ContactRow> {
  const fields: Partial<ContactRow> = {};
  if (updates.name !== undefined) {
    const parts = String(updates.name)
      .trim()
      .split(/\s+/);
    fields.first_name = parts[0] ?? "";
    fields.last_name = parts.slice(1).join(" ");
  }
  if (updates.email !== undefined) fields.email = updates.email as string;
  if (updates.phone !== undefined)
    fields.phone_primary = updates.phone as string;
  if (updates.jobTitle !== undefined)
    fields.job_title = updates.jobTitle as string;
  if (updates.companyId !== undefined)
    fields.company_id = updates.companyId as string | null;
  if (updates.linkedinUrl !== undefined)
    fields.linkedin_url = updates.linkedinUrl as string | null;
  if (updates.avatarUrl !== undefined)
    fields.avatar_url = updates.avatarUrl as string | null;
  return fields;
}

const ContactNameCell = createAvatarNameCell<Contact>(
  (c) => c.profileImageUrl,
  "bg-indigo-100",
  "text-indigo-700"
);

const COLUMN_WIDTHS: Record<string, number> = {
  select: 40,
  rowNum: 40,
  name: 160,
  email: 200,
  phone: 140,
  jobTitle: 130,
  companyId: 160,
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

export default function ContactsGrid({
  onRowClick,
  toolbarExtra,
}: {
  onRowClick?: (row: Contact) => void;
  toolbarExtra?: React.ReactNode;
}) {
  const {
    data: rows,
    isLoading,
    error,
    refetch,
  } = useContactList();
  const { data: companyRows } = useCompanyList();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const archiveContact = useArchiveContact();

  const contacts: Contact[] = (rows ?? []).map(mapContactRow);
  const companyOptions = (companyRows ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const CompanyCell = createRelationCell<Contact>(
    () => companyOptions,
    "companyId"
  );

  const columns: ColumnDef<Contact, unknown>[] = [
    {
      accessorKey: "name",
      header: "Name",
      size: COLUMN_WIDTHS.name,
      cell: ContactNameCell,
      filterFn: "includesString",
      meta: { cellType: "text" as const, dataType: "text" as const },
    },
    {
      accessorKey: "email",
      header: "Email",
      size: COLUMN_WIDTHS.email,
      cell: EditableTextCell,
      filterFn: "includesString",
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
      accessorKey: "jobTitle",
      header: "Job Title",
      size: COLUMN_WIDTHS.jobTitle,
      cell: EditableTextCell,
      filterFn: "includesString",
      meta: { cellType: "text" as const, dataType: "text" as const },
    },
    {
      accessorKey: "companyId",
      header: "Company",
      size: COLUMN_WIDTHS.companyId,
      cell: CompanyCell,
      filterFn: "equals",
      meta: { cellType: "dropdown" as const },
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
    <DataGrid<Contact>
      data={contacts}
      columns={columns}
      columnWidths={COLUMN_WIDTHS}
      entityName="Contacts"
      entityIcon={Users}
      onAdd={() =>
        createContact.mutate({
          first_name: "",
          last_name: "",
          email: null,
          phone_primary: null,
          phone_secondary: null,
          whatsapp: null,
          job_title: null,
          department: null,
          company_id: null,
          owner_id: null,
          lead_source: null,
          linkedin_url: null,
          avatar_url: null,
          created_by: null,
        })
      }
      onUpdate={(id, updates) =>
        updateContact.mutate({ id, ...contactUpdateFields(updates) })
      }
      onDelete={(ids) => ids.forEach((id) => archiveContact.mutate(id))}
      onRowClick={onRowClick}
      toolbarExtra={toolbarExtra}
      defaultHiddenColumns={AUDIT_HIDDEN_COLUMNS}
    />
  );
}
