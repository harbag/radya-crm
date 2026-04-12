// ── Base ────────────────────────────────────────────────────────────────────
export type EntityType = "contact" | "company" | "lead" | "deal" | "task";

export type AuditFields = {
  createdBy: string;
  createdAt: string;
  lastModifiedBy: string;
  lastModifiedAt: string;
};

// ── Contact ─────────────────────────────────────────────────────────────────
export type ContactStatus = "lead" | "prospect" | "customer" | "churned";

export type Contact = AuditFields & {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyId: string | null;
  jobTitle: string;
  status: ContactStatus;
  notes: string;
  linkedinUrl?: string;
  profileImageUrl?: string;
  // DB fields
  firstName?: string;
  lastName?: string;
  phonePrimary?: string;
  phoneSecondary?: string;
  whatsapp?: string;
  department?: string;
  avatarUrl?: string;
  customFields?: Record<string, unknown>;
  isArchived?: boolean;
  ownerId?: string;
};

// ── Company ─────────────────────────────────────────────────────────────────
export type Company = AuditFields & {
  id: string;
  name: string;
  industry: string;
  website: string;
  phone: string;
  address: string;
  notes: string;
  logoUrl?: string;
  // DB fields
  companySize?: "1-10" | "11-50" | "51-200" | "201-500" | "500+";
  emailDomain?: string;
  addressCity?: string;
  addressProvince?: string;
  addressCountry?: string;
  ownerId?: string;
  annualRevenue?: number;
  customFields?: Record<string, unknown>;
  isArchived?: boolean;
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

export type Lead = AuditFields & {
  id: string;
  title: string;
  source: LeadSource;
  status: LeadStatus;
  contactId: string | null;
  companyId: string | null;
  estimatedValue: number;
  notes: string;
  // DB fields
  priority?: "low" | "medium" | "high";
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  customFields?: Record<string, unknown>;
  isArchived?: boolean;
  convertedAt?: string;
  convertedDealId?: string;
  ownerId?: string;
};

// ── Deal ────────────────────────────────────────────────────────────────────
export type DealStage =
  | "prospecting"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export type Deal = AuditFields & {
  id: string;
  title: string;
  value: number;
  contactId: string;
  companyId: string | null;
  stage: DealStage;
  probability: number;
  expectedCloseDate: string;
  notes: string;
  // DB fields
  pipelineId?: string;
  stageId?: string;
  currency?: string;
  actualCloseDate?: string;
  lostReason?: string;
  leadSource?: string;
  customFields?: Record<string, unknown>;
  isArchived?: boolean;
  ownerId?: string;
  stageChangedAt?: string;
  dealStatus?: "open" | "won" | "lost" | "on_hold";
};

// ── Task ────────────────────────────────────────────────────────────────────
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type Task = AuditFields & {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  linkedEntityType: EntityType | null;
  linkedEntityId: string | null;
  assignee: string;
  // DB fields
  entityType?: "lead" | "deal" | "contact" | "company";
  entityId?: string;
  assigneeId?: string;
  dueTime?: string;
  completedAt?: string;
  taskType?: "call" | "whatsapp" | "meeting" | "email" | "follow_up" | "other";
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

// ── Attachment ──────────────────────────────────────────────────────────────
export type Attachment = {
  id: string;
  name: string;
  type: string; // MIME type or "google_drive_link"
  size: number;
  url: string; // blob URL, data URL, or external link
  thumbnailUrl?: string;
  linkedEntityType: EntityType;
  linkedEntityId: string;
  createdAt: string;
  createdBy: string;
};

// ── Supabase-backed types ────────────────────────────────────────────────────

export type UserRole = "admin" | "sales" | "viewer";

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PipelineStage = {
  id: string;
  pipelineId: string;
  name: string;
  orderIndex: number;
  defaultProbability: number;
  color?: string;
  isWonStage: boolean;
  isLostStage: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Pipeline = {
  id: string;
  name: string;
  isDefault: boolean;
  stages?: PipelineStage[];
  createdAt: string;
  updatedAt: string;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
  entityTypes: string[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmComment = {
  id: string;
  body: string;
  entityType: "lead" | "deal" | "contact" | "company";
  entityId: string;
  parentCommentId?: string;
  authorId?: string;
  mentionedUserIds: string[];
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ActivityLog = {
  id: string;
  entityType: string;
  entityId: string;
  actorId?: string;
  action: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
};

export type Notification = {
  id: string;
  recipientId: string;
  type: string;
  entityType?: string;
  entityId?: string;
  body: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
};
