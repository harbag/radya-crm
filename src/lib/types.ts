// ── Base ────────────────────────────────────────────────────────────────────
export type EntityType = "contact" | "company" | "lead" | "deal" | "task";

// ── Contact ─────────────────────────────────────────────────────────────────
export type ContactStatus = "lead" | "prospect" | "customer" | "churned";

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyId: string | null;
  jobTitle: string;
  status: ContactStatus;
  notes: string;
  createdAt: string;
};

// ── Company ─────────────────────────────────────────────────────────────────
export type Company = {
  id: string;
  name: string;
  industry: string;
  website: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: string;
};

// ── Lead ────────────────────────────────────────────────────────────────────
export type LeadSource =
  | "website"
  | "referral"
  | "cold_call"
  | "event"
  | "social_media"
  | "other";

export type LeadStatus = "new" | "contacted" | "qualified" | "unqualified";

export type Lead = {
  id: string;
  title: string;
  source: LeadSource;
  status: LeadStatus;
  contactId: string | null;
  companyId: string | null;
  estimatedValue: number;
  notes: string;
  createdAt: string;
};

// ── Deal ────────────────────────────────────────────────────────────────────
export type DealStage =
  | "prospecting"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export type Deal = {
  id: string;
  title: string;
  value: number;
  contactId: string;
  companyId: string | null;
  stage: DealStage;
  probability: number;
  expectedCloseDate: string;
  notes: string;
  createdAt: string;
};

// ── Task ────────────────────────────────────────────────────────────────────
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  linkedEntityType: EntityType | null;
  linkedEntityId: string | null;
  assignee: string;
  createdAt: string;
};

// ── Note ────────────────────────────────────────────────────────────────────
export type Note = {
  id: string;
  content: string;
  linkedEntityType: EntityType;
  linkedEntityId: string;
  createdAt: string;
};

// ── Activity ────────────────────────────────────────────────────────────────
export type ActivityType =
  | "call"
  | "email"
  | "meeting"
  | "note_added"
  | "task_completed"
  | "deal_created"
  | "deal_stage_changed"
  | "lead_status_changed"
  | "contact_created"
  | "company_created";

export type Activity = {
  id: string;
  type: ActivityType;
  description: string;
  linkedEntityType: EntityType;
  linkedEntityId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};
