"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import EntityHeader from "./detail-sections/entity-header";
import Timeline from "./detail-sections/timeline";
import LinkedTasks from "./detail-sections/linked-tasks";
import LinkedNotes from "./detail-sections/linked-notes";
import LinkedDeals from "./detail-sections/linked-deals";
import LinkedContacts from "./detail-sections/linked-contacts";
import AttachmentManager from "./attachment-manager";
import { useDetailPanelStore } from "@/store/use-detail-panel-store";
import { useContactList } from "@/lib/queries/contacts";
import { useCompanyList } from "@/lib/queries/companies";
import { useDealList, type DealRow } from "@/lib/queries/deals";
import {
  useTaskList,
  useCreateTask,
  useUpdateTask,
  type TaskRow,
} from "@/lib/queries/tasks";
import {
  useNoteList,
  useCreateNote,
  type NoteRow,
} from "@/lib/queries/notes";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  formatCurrency,
  TASK_STATUS_CONFIG,
} from "@/lib/mock-data";
import type { EntityType, Note, Task, Deal } from "@/lib/types";
import type { TaskStatus, TaskPriority } from "@/lib/types";

// ── mappers ─────────────────────────────────────────────────────────────────

function mapNoteRow(row: NoteRow): Note {
  return {
    id: row.id,
    content: row.body,
    linkedEntityType: row.entity_type as EntityType,
    linkedEntityId: row.entity_id,
    createdAt: row.created_at,
  };
}

function mapTaskRow(row: TaskRow): Task {
  const status: TaskStatus = row.status === "completed" ? "done" : "todo";
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    status,
    priority: (row.priority as TaskPriority) ?? "medium",
    dueDate: row.due_date,
    linkedEntityType: (row.entity_type as EntityType) ?? null,
    linkedEntityId: row.entity_id ?? null,
    assignee: row.assignee_id ?? "",
    entityType: row.entity_type ?? undefined,
    entityId: row.entity_id ?? undefined,
    assigneeId: row.assignee_id ?? undefined,
    dueTime: row.due_time ?? undefined,
    completedAt: row.completed_at ?? undefined,
    taskType: row.type ?? undefined,
    createdAt: row.created_at,
    createdBy: row.created_by ?? "",
    lastModifiedAt: row.updated_at,
    lastModifiedBy: "",
  };
}

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

// ── main content ─────────────────────────────────────────────────────────────

function EntityDetailContent({
  entityType,
  entityId,
}: {
  entityType: EntityType;
  entityId: string;
}) {
  const { data: currentUser } = useCurrentUser();

  // List queries (cached from main views)
  const { data: contactRows } = useContactList();
  const { data: companyRows } = useCompanyList();
  const { data: dealRows } = useDealList();

  // Per-entity notes and tasks
  const noteFilters = { entity_type: entityType as NoteRow["entity_type"], entity_id: entityId };
  const taskFilters = { entity_type: entityType as TaskRow["entity_type"], entity_id: entityId };

  const { data: noteRows } = useNoteList(noteFilters);
  const { data: taskRows } = useTaskList(taskFilters);
  const createNote = useCreateNote();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const notes: Note[] = (noteRows ?? []).map(mapNoteRow);
  const tasks: Task[] = (taskRows ?? []).map(mapTaskRow);

  // Lookup helpers
  const contacts = contactRows ?? [];
  const companies = companyRows ?? [];
  const deals = (dealRows ?? []).map(mapDealRow);

  // Build header info based on entity type
  let name = "";
  let subtitle = "";
  let headerImageUrl: string | undefined;
  let overviewContent: React.ReactNode = null;
  let showDeals = false;
  let showContacts = false;
  let entityDeals: Deal[] = [];
  let entityContacts: typeof contacts = [];

  if (entityType === "contact") {
    const contact = contacts.find((c) => c.id === entityId);
    if (!contact) return <p className="p-4 text-sm text-zinc-400">Contact not found</p>;
    const company = companies.find((c) => c.id === contact.company_id);
    name = [contact.first_name, contact.last_name].filter(Boolean).join(" ") || contact.email || entityId;
    subtitle = [contact.job_title, company?.name].filter(Boolean).join(" at ");
    headerImageUrl = contact.avatar_url ?? undefined;
    showDeals = true;
    entityDeals = deals.filter((d) => d.contactId === entityId);
    overviewContent = (
      <div className="space-y-3 text-sm">
        <InfoRow label="Email" value={contact.email ?? undefined} />
        <InfoRow label="Phone" value={contact.phone_primary ?? undefined} />
        <InfoRow label="Job Title" value={contact.job_title ?? undefined} />
        <InfoRow label="Company" value={company?.name} />
      </div>
    );
  } else if (entityType === "company") {
    const company = companies.find((c) => c.id === entityId);
    if (!company) return <p className="p-4 text-sm text-zinc-400">Company not found</p>;
    name = company.name;
    subtitle = company.industry ?? "";
    if (company.logo_url) {
      headerImageUrl = company.logo_url;
    } else if (company.website) {
      try { headerImageUrl = `https://logo.clearbit.com/${new URL(company.website).hostname}`; } catch {}
    }
    showDeals = true;
    showContacts = true;
    entityDeals = deals.filter((d) => d.companyId === entityId);
    entityContacts = contacts.filter((c) => c.company_id === entityId);
    overviewContent = (
      <div className="space-y-3 text-sm">
        <InfoRow label="Industry" value={company.industry ?? undefined} />
        <InfoRow label="Website" value={company.website ?? undefined} />
        <InfoRow label="Phone" value={company.phone ?? undefined} />
        <InfoRow
          label="Address"
          value={[company.address_city, company.address_province].filter(Boolean).join(", ") || undefined}
        />
      </div>
    );
  } else if (entityType === "deal") {
    const dealRow = dealRows?.find((d) => d.id === entityId);
    if (!dealRow) return <p className="p-4 text-sm text-zinc-400">Deal not found</p>;
    const contact = contacts.find((c) => c.id === dealRow.contact_id);
    const company = companies.find((c) => c.id === dealRow.company_id);
    const contactName = contact
      ? [contact.first_name, contact.last_name].filter(Boolean).join(" ") || contact.email || ""
      : undefined;
    name = dealRow.title;
    subtitle = formatCurrency(dealRow.value);
    overviewContent = (
      <div className="space-y-3 text-sm">
        <InfoRow label="Value" value={formatCurrency(dealRow.value)} />
        <InfoRow label="Probability" value={`${dealRow.probability}%`} />
        <InfoRow label="Contact" value={contactName} />
        <InfoRow label="Company" value={company?.name} />
        {dealRow.expected_close_date && (
          <InfoRow
            label="Close Date"
            value={new Date(dealRow.expected_close_date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          />
        )}
        {dealRow.lost_reason && <InfoRow label="Lost Reason" value={dealRow.lost_reason} />}
      </div>
    );
  } else if (entityType === "lead") {
    const leadRows_ref = { data: [] as { id: string; title: string; estimated_value: number | null; status: string }[] };
    // Leads have no cached list here; show minimal info
    name = entityId;
    subtitle = "";
    overviewContent = (
      <div className="space-y-3 text-sm">
        <p className="text-zinc-400 text-xs">Lead details available in Leads view.</p>
      </div>
    );
    void leadRows_ref; // suppress unused warning
  } else if (entityType === "task") {
    const taskRow = taskRows?.find((t) => t.id === entityId);
    if (taskRow) {
      name = taskRow.title;
      subtitle = TASK_STATUS_CONFIG[taskRow.status === "completed" ? "done" : "todo"].label;
      overviewContent = (
        <div className="space-y-3 text-sm">
          <InfoRow label="Status" value={TASK_STATUS_CONFIG[taskRow.status === "completed" ? "done" : "todo"].label} />
          <InfoRow label="Priority" value={taskRow.priority ?? undefined} />
          <InfoRow label="Assignee" value={taskRow.assignee_id ?? undefined} />
          {taskRow.due_date && (
            <InfoRow
              label="Due Date"
              value={new Date(taskRow.due_date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            />
          )}
          <InfoRow label="Description" value={taskRow.description ?? undefined} />
        </div>
      );
    }
  }

  const handleAddNote = (content: string) => {
    createNote.mutate({
      body: content,
      entity_type: entityType as NoteRow["entity_type"],
      entity_id: entityId,
      author_id: currentUser?.id ?? null,
      is_pinned: false,
      mentioned_user_ids: [],
    });
  };

  const handleAddTask = (title: string) => {
    createTask.mutate({
      title,
      description: null,
      entity_type: entityType as TaskRow["entity_type"],
      entity_id: entityId,
      status: "open",
      priority: "medium",
      due_date: null,
      due_time: null,
      assignee_id: null,
      created_by: currentUser?.id ?? null,
      completed_at: null,
      type: null,
    });
  };

  const handleToggleTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === "done" ? "open" : "completed";
    updateTask.mutate({
      id: taskId,
      status: newStatus,
      ...(newStatus === "completed" ? { completed_at: new Date().toISOString() } : { completed_at: null }),
    });
  };

  // Map contacts for LinkedContacts (it expects Contact[] from types.ts)
  const mappedEntityContacts = entityContacts.map((c) => ({
    id: c.id,
    name: [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email || c.id,
    email: c.email ?? "",
    phone: c.phone_primary ?? "",
    jobTitle: c.job_title ?? "",
    companyId: c.company_id,
    status: "lead" as const,
    notes: "",
    createdAt: c.created_at,
    createdBy: c.created_by ?? "",
    lastModifiedAt: c.updated_at,
    lastModifiedBy: "",
  }));

  // Build tab list
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "tasks", label: `Tasks (${tasks.length})` },
    { id: "notes", label: `Notes (${notes.length})` },
    { id: "timeline", label: "Timeline" },
  ];
  if (entityType === "deal") {
    tabs.push({ id: "attachments", label: "Attachments" });
  }
  if (showDeals)
    tabs.push({ id: "deals", label: `Deals (${entityDeals.length})` });
  if (showContacts)
    tabs.push({ id: "contacts", label: `Contacts (${entityContacts.length})` });

  return (
    <>
      <SheetHeader className="pr-8">
        <SheetTitle asChild>
          <EntityHeader
            entityType={entityType}
            name={name}
            subtitle={subtitle}
            imageUrl={headerImageUrl}
          />
        </SheetTitle>
        <SheetDescription className="sr-only">
          {entityType} details
        </SheetDescription>
      </SheetHeader>

      <Tabs defaultValue="overview" className="mt-4 flex flex-1 flex-col overflow-hidden">
        <TabsList className="w-full justify-start overflow-x-auto">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="text-xs shrink-0">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <ScrollArea className="flex-1 mt-4">
          <TabsContent value="overview" className="m-0">
            {overviewContent}
          </TabsContent>

          <TabsContent value="tasks" className="m-0">
            <LinkedTasks
              tasks={tasks}
              onToggle={handleToggleTask}
              onAdd={handleAddTask}
            />
          </TabsContent>

          <TabsContent value="notes" className="m-0">
            <LinkedNotes
              notes={notes}
              onAdd={handleAddNote}
            />
          </TabsContent>

          <TabsContent value="timeline" className="m-0">
            <Timeline
              activities={[]}
              notes={notes}
              tasks={tasks}
              onAddNote={handleAddNote}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
            />
          </TabsContent>

          {entityType === "deal" && entityId && (
            <TabsContent value="attachments" className="m-0">
              <AttachmentManager entityType="deal" entityId={entityId} />
            </TabsContent>
          )}

          {showDeals && (
            <TabsContent value="deals" className="m-0">
              <LinkedDeals deals={entityDeals} />
            </TabsContent>
          )}

          {showContacts && (
            <TabsContent value="contacts" className="m-0">
              <LinkedContacts contacts={mappedEntityContacts} />
            </TabsContent>
          )}
        </ScrollArea>
      </Tabs>
    </>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className="w-24 shrink-0 text-zinc-500">{label}</span>
      <span className="text-zinc-900">{value}</span>
    </div>
  );
}

export default function EntityDetailPanel() {
  const { isOpen, entityType, entityId, close } = useDetailPanelStore();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent className="flex flex-col overflow-hidden sm:max-w-lg">
        {entityType && entityId && (
          <EntityDetailContent
            entityType={entityType}
            entityId={entityId}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
