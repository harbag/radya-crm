"use client";

import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Users } from "lucide-react";
import DataGrid, { type FilterOption } from "@/components/shared/data-grid";
import {
  EditableTextCell,
  createStatusBadgeCell,
  DateCell,
  createRelationCell,
} from "@/components/shared/grid-cells";
import { useContactsStore } from "@/store/use-contacts-store";
import { useCompaniesStore } from "@/store/use-companies-store";
import { STATUS_CONFIG, type Contact } from "@/lib/mock-data";

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
  createdAt: 110,
  actions: 44,
};

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

  const columns: ColumnDef<Contact, any>[] = [
    {
      accessorKey: "name",
      header: "Name",
      size: COLUMN_WIDTHS.name,
      cell: EditableTextCell,
      filterFn: "includesString",
    },
    {
      accessorKey: "email",
      header: "Email",
      size: COLUMN_WIDTHS.email,
      cell: EditableTextCell,
      filterFn: "includesString",
    },
    {
      accessorKey: "phone",
      header: "Phone",
      size: COLUMN_WIDTHS.phone,
      cell: EditableTextCell,
      enableColumnFilter: false,
    },
    {
      accessorKey: "jobTitle",
      header: "Job Title",
      size: COLUMN_WIDTHS.jobTitle,
      cell: EditableTextCell,
      filterFn: "includesString",
    },
    {
      accessorKey: "companyId",
      header: "Company",
      size: COLUMN_WIDTHS.companyId,
      cell: CompanyCell,
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
      options: Object.entries(STATUS_CONFIG).map(([key, val]) => ({
        value: key,
        label: val.label,
      })),
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
      filterOptions={filterOptions}
      toolbarExtra={toolbarExtra}
    />
  );
}
