// Re-export types for backward compatibility
export type {
  ContactStatus,
  Contact,
  Company,
  LeadSource,
  LeadStatus,
  Lead,
  DealStage,
  Deal,
  TaskStatus,
  TaskPriority,
  Task,
  Note,
  ActivityType,
  Activity,
  EntityType,
} from "./types";

import type {
  Contact,
  ContactStatus,
  Company,
  Lead,
  LeadSource,
  LeadStatus,
  DealStage,
  Deal,
  TaskStatus,
  TaskPriority,
  Task,
  Note,
  Activity,
} from "./types";

// Real data now comes from Supabase via React Query hooks in src/lib/queries/.
// These arrays are kept empty so existing imports continue to compile.

export const COMPANIES: Company[] = [];
export const CONTACTS: Contact[] = [];
export const LEADS: Lead[] = [];
export const DEALS: Deal[] = [];
export const TASKS: Task[] = [];
export const NOTES: Note[] = [];
export const ACTIVITIES: Activity[] = [];

// ── Config objects ──────────────────────────────────────────────────────────
export const STATUS_CONFIG: Record<
  ContactStatus,
  { label: string; className: string }
> = {
  lead: { label: "Lead", className: "bg-blue-100 text-blue-700" },
  prospect: { label: "Prospect", className: "bg-yellow-100 text-yellow-700" },
  customer: { label: "Customer", className: "bg-green-100 text-green-700" },
  churned: { label: "Churned", className: "bg-red-100 text-red-700" },
};

export const DEAL_STAGES: { id: DealStage; label: string }[] = [
  { id: "prospecting", label: "Prospecting" },
  { id: "proposal", label: "Proposal Sent" },
  { id: "negotiation", label: "Negotiation" },
  { id: "closed_won", label: "Closed Won" },
  { id: "closed_lost", label: "Closed Lost" },
];

export const LEAD_SOURCE_CONFIG: Record<
  LeadSource,
  { label: string; className: string }
> = {
  website: { label: "Website", className: "bg-blue-100 text-blue-700" },
  referral: { label: "Referral", className: "bg-green-100 text-green-700" },
  cold_call: { label: "Cold Call", className: "bg-orange-100 text-orange-700" },
  event: { label: "Event", className: "bg-purple-100 text-purple-700" },
  social_media: {
    label: "Social Media",
    className: "bg-pink-100 text-pink-700",
  },
  other: { label: "Other", className: "bg-zinc-100 text-zinc-700" },
};

export const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; className: string }
> = {
  new: { label: "New", className: "bg-blue-100 text-blue-700" },
  contacted: {
    label: "Contacted",
    className: "bg-yellow-100 text-yellow-700",
  },
  qualified: {
    label: "Qualified",
    className: "bg-green-100 text-green-700",
  },
  unqualified: { label: "Unqualified", className: "bg-red-100 text-red-700" },
};

export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; className: string }
> = {
  todo: { label: "To Do", className: "bg-zinc-100 text-zinc-700" },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-700",
  },
  done: { label: "Done", className: "bg-green-100 text-green-700" },
};

export const TASK_PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  low: { label: "Low", className: "bg-zinc-100 text-zinc-600" },
  medium: { label: "Medium", className: "bg-yellow-100 text-yellow-700" },
  high: { label: "High", className: "bg-red-100 text-red-700" },
};

export const DEAL_STAGE_CONFIG: Record<
  DealStage,
  { label: string; className: string }
> = {
  prospecting: {
    label: "Prospecting",
    className: "bg-blue-100 text-blue-700",
  },
  proposal: { label: "Proposal", className: "bg-amber-100 text-amber-700" },
  negotiation: {
    label: "Negotiation",
    className: "bg-orange-100 text-orange-700",
  },
  closed_won: {
    label: "Closed Won",
    className: "bg-green-100 text-green-700",
  },
  closed_lost: { label: "Closed Lost", className: "bg-red-100 text-red-700" },
};

// ── Helpers ─────────────────────────────────────────────────────────────────
export function getContactById(id: string): Contact | undefined {
  return CONTACTS.find((c) => c.id === id);
}

export function getCompanyById(id: string): Company | undefined {
  return COMPANIES.find((c) => c.id === id);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
