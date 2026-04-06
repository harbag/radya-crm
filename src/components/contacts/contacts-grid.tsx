"use client";

import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Users } from "lucide-react";
import DataGrid from "@/components/shared/data-grid";
import {
  EditableTextCell,
  LongTextCell,
  createStatusBadgeCell,
  createAvatarNameCell,
  DateCell,
  DateTimeCell,
  createRelationCell,
} from "@/components/shared/grid-cells";
import { useContactsStore } from "@/store/use-contacts-store";
import { useCompaniesStore } from "@/store/use-companies-store";
import { STATUS_CONFIG, type Contact } from "@/lib/mock-data";

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
  status: 120,
  notes: 220,
  createdAt: 130,
  createdBy: 130,
  lastModifiedAt: 150,
  lastModifiedBy: 130,
  actions: 44,
};

const AUDIT_HIDDEN_COLUMNS = ["createdAt", "createdBy", "lastModifiedAt", "lastModifiedBy"];

const StatusCell = createStatusBadgeCell<Contact>(STATUS_CONFIG, "status");

export default function ContactsGrid({
  onRowClick,
  toolbarExtra,
}: {
  onRowClick?: (row: Contact) => void;
  toolbarExtra?: React.ReactNode;
}) {
  const { contacts, addContact, updateContact, deleteContacts } =
    useContactsStore();
  const { companies } = useCompaniesStore();

  const CompanyCell = createRelationCell<Contact>(
    () => companies.map((c) => ({ id: c.id, name: c.name })),
    "companyId"
  );

  const statusOptions = Object.entries(STATUS_CONFIG).map(([key, val]) => ({
    value: key,
    label: val.label,
  }));

  const columns: ColumnDef<Contact, any>[] = [
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
      accessorKey: "status",
      header: "Status",
      size: COLUMN_WIDTHS.status,
      cell: StatusCell,
      filterFn: "equals",
      meta: { cellType: "dropdown" as const, dataType: "select" as const, selectOptions: statusOptions },
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
    <DataGrid<Contact>
      data={contacts}
      columns={columns}
      columnWidths={COLUMN_WIDTHS}
      entityName="Contacts"
      entityIcon={Users}
      onAdd={() =>
        addContact({
          name: "",
          email: "",
          phone: "",
          companyId: null,
          jobTitle: "",
          status: "lead",
          notes: "",
        })
      }
      onUpdate={(id, updates) => updateContact(id, updates as Partial<Contact>)}
      onDelete={deleteContacts}
      onRowClick={onRowClick}
      toolbarExtra={toolbarExtra}
      defaultHiddenColumns={AUDIT_HIDDEN_COLUMNS}
    />
  );
}
