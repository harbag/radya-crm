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
import { useContactsStore } from "@/store/use-contacts-store";
import { useCompaniesStore } from "@/store/use-companies-store";
import { useDealsStore } from "@/store/use-deals-store";
import { useLeadsStore } from "@/store/use-leads-store";
import { useTasksStore } from "@/store/use-tasks-store";
import { useNotesStore } from "@/store/use-notes-store";
import { useActivitiesStore } from "@/store/use-activities-store";
import { useDetailPanelStore } from "@/store/use-detail-panel-store";
import { getLinkedTasks, getLinkedNotes, getActivityFeed } from "@/lib/entity-helpers";
import {
  formatCurrency,
  STATUS_CONFIG,
  DEAL_STAGE_CONFIG,
  LEAD_STATUS_CONFIG,
  TASK_STATUS_CONFIG,
} from "@/lib/mock-data";
import type { EntityType } from "@/lib/types";

function EntityDetailContent({
  entityType,
  entityId,
}: {
  entityType: EntityType;
  entityId: string;
}) {
  const { contacts } = useContactsStore();
  const { companies } = useCompaniesStore();
  const { deals } = useDealsStore();
  const { leads } = useLeadsStore();
  const { tasks, toggleTaskStatus, addTask } = useTasksStore();
  const { notes, addNote } = useNotesStore();
  const { activities } = useActivitiesStore();
  const { addActivity } = useActivitiesStore();

  const linkedTasks = getLinkedTasks(tasks, entityType, entityId);
  const linkedNotes = getLinkedNotes(notes, entityType, entityId);
  const linkedActivities = getActivityFeed(activities, entityType, entityId);

  // Build header info based on entity type
  let name = "";
  let subtitle = "";
  let overviewContent: React.ReactNode = null;
  let showDeals = false;
  let showContacts = false;
  let entityDeals: typeof deals = [];
  let entityContacts: typeof contacts = [];

  if (entityType === "contact") {
    const contact = contacts.find((c) => c.id === entityId);
    if (!contact) return <p className="p-4 text-sm text-zinc-400">Contact not found</p>;
    const company = companies.find((c) => c.id === contact.companyId);
    name = contact.name;
    subtitle = [contact.jobTitle, company?.name].filter(Boolean).join(" at ");
    showDeals = true;
    entityDeals = deals.filter((d) => d.contactId === entityId);
    overviewContent = (
      <div className="space-y-3 text-sm">
        <InfoRow label="Email" value={contact.email} />
        <InfoRow label="Phone" value={contact.phone} />
        <InfoRow label="Status" value={STATUS_CONFIG[contact.status].label} />
        <InfoRow label="Company" value={company?.name} />
        <InfoRow label="Notes" value={contact.notes} />
      </div>
    );
  } else if (entityType === "company") {
    const company = companies.find((c) => c.id === entityId);
    if (!company) return <p className="p-4 text-sm text-zinc-400">Company not found</p>;
    name = company.name;
    subtitle = company.industry;
    showDeals = true;
    showContacts = true;
    entityDeals = deals.filter((d) => d.companyId === entityId);
    entityContacts = contacts.filter((c) => c.companyId === entityId);
    overviewContent = (
      <div className="space-y-3 text-sm">
        <InfoRow label="Industry" value={company.industry} />
        <InfoRow label="Website" value={company.website} />
        <InfoRow label="Phone" value={company.phone} />
        <InfoRow label="Address" value={company.address} />
        <InfoRow label="Notes" value={company.notes} />
      </div>
    );
  } else if (entityType === "deal") {
    const deal = deals.find((d) => d.id === entityId);
    if (!deal) return <p className="p-4 text-sm text-zinc-400">Deal not found</p>;
    const contact = contacts.find((c) => c.id === deal.contactId);
    const company = companies.find((c) => c.id === deal.companyId);
    name = deal.title;
    subtitle = formatCurrency(deal.value);
    overviewContent = (
      <div className="space-y-3 text-sm">
        <InfoRow label="Stage" value={DEAL_STAGE_CONFIG[deal.stage].label} />
        <InfoRow label="Value" value={formatCurrency(deal.value)} />
        <InfoRow label="Probability" value={`${deal.probability}%`} />
        <InfoRow label="Contact" value={contact?.name} />
        <InfoRow label="Company" value={company?.name} />
        <InfoRow
          label="Close Date"
          value={new Date(deal.expectedCloseDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        />
        <InfoRow label="Notes" value={deal.notes} />
      </div>
    );
  } else if (entityType === "lead") {
    const lead = leads.find((l) => l.id === entityId);
    if (!lead) return <p className="p-4 text-sm text-zinc-400">Lead not found</p>;
    name = lead.title;
    subtitle = formatCurrency(lead.estimatedValue);
    overviewContent = (
      <div className="space-y-3 text-sm">
        <InfoRow label="Status" value={LEAD_STATUS_CONFIG[lead.status].label} />
        <InfoRow label="Est. Value" value={formatCurrency(lead.estimatedValue)} />
        <InfoRow label="Notes" value={lead.notes} />
      </div>
    );
  } else if (entityType === "task") {
    const task = tasks.find((t) => t.id === entityId);
    if (!task) return <p className="p-4 text-sm text-zinc-400">Task not found</p>;
    name = task.title;
    subtitle = TASK_STATUS_CONFIG[task.status].label;
    overviewContent = (
      <div className="space-y-3 text-sm">
        <InfoRow label="Status" value={TASK_STATUS_CONFIG[task.status].label} />
        <InfoRow label="Priority" value={task.priority} />
        <InfoRow label="Assignee" value={task.assignee} />
        <InfoRow
          label="Due Date"
          value={
            task.dueDate
              ? new Date(task.dueDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : undefined
          }
        />
        <InfoRow label="Description" value={task.description} />
      </div>
    );
  }

  const handleAddNote = (content: string) => {
    addNote({
      content,
      linkedEntityType: entityType,
      linkedEntityId: entityId,
    });
    addActivity({
      type: "note_added",
      description: `Note added to ${entityType} "${name}"`,
      linkedEntityType: entityType,
      linkedEntityId: entityId,
    });
  };

  const handleAddTask = (title: string) => {
    addTask({
      title,
      description: "",
      status: "todo",
      priority: "medium",
      dueDate: null,
      linkedEntityType: entityType,
      linkedEntityId: entityId,
      assignee: "",
    });
    addActivity({
      type: "note_added",
      description: `Task "${title}" added to ${entityType} "${name}"`,
      linkedEntityType: entityType,
      linkedEntityId: entityId,
    });
  };

  // Build tab list
  const timelineCount = linkedActivities.length + linkedNotes.length + linkedTasks.length;
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "timeline", label: `Timeline (${timelineCount})` },
    { id: "tasks", label: `Tasks (${linkedTasks.length})` },
    { id: "notes", label: `Notes (${linkedNotes.length})` },
  ];
  if (showDeals)
    tabs.push({ id: "deals", label: `Deals (${entityDeals.length})` });
  if (showContacts)
    tabs.push({
      id: "contacts",
      label: `Contacts (${entityContacts.length})`,
    });

  return (
    <>
      <SheetHeader className="pr-8">
        <SheetTitle asChild>
          <EntityHeader
            entityType={entityType}
            name={name}
            subtitle={subtitle}
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

          <TabsContent value="timeline" className="m-0">
            <Timeline
              activities={linkedActivities}
              notes={linkedNotes}
              tasks={linkedTasks}
              onAddNote={handleAddNote}
              onAddTask={handleAddTask}
              onToggleTask={toggleTaskStatus}
            />
          </TabsContent>

          <TabsContent value="tasks" className="m-0">
            <LinkedTasks
              tasks={linkedTasks}
              onToggle={toggleTaskStatus}
              onAdd={handleAddTask}
            />
          </TabsContent>

          <TabsContent value="notes" className="m-0">
            <LinkedNotes
              notes={linkedNotes}
              onAdd={handleAddNote}
            />
          </TabsContent>

          {showDeals && (
            <TabsContent value="deals" className="m-0">
              <LinkedDeals deals={entityDeals} />
            </TabsContent>
          )}

          {showContacts && (
            <TabsContent value="contacts" className="m-0">
              <LinkedContacts contacts={entityContacts} />
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
