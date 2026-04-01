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

// ── Companies ───────────────────────────────────────────────────────────────
export const COMPANIES: Company[] = [
  {
    id: "comp1",
    name: "TechCorp Indonesia",
    industry: "Technology",
    website: "https://techcorp.id",
    phone: "+62 21-555-0100",
    address: "Jl. Sudirman No.1, Jakarta Selatan",
    notes: "Major enterprise client, partnered since 2022.",
    createdAt: "2022-01-15",
  },
  {
    id: "comp2",
    name: "StartupIO",
    industry: "Technology",
    website: "https://startup.io",
    phone: "+62 21-555-0200",
    address: "Jl. Gatot Subroto No.12, Jakarta",
    notes: "Fast-growing SaaS startup. Key decision-maker: CEO.",
    createdAt: "2023-11-20",
  },
  {
    id: "comp3",
    name: "Retail Co",
    industry: "Retail",
    website: "https://retail.co.id",
    phone: "+62 21-555-0300",
    address: "Jl. Thamrin No.45, Jakarta Pusat",
    notes: "Retail chain with 50+ stores across Java.",
    createdAt: "2024-05-10",
  },
  {
    id: "comp4",
    name: "Fintech ID",
    industry: "Financial Services",
    website: "https://fintech.id",
    phone: "+62 21-555-0400",
    address: "Jl. Kuningan Mulia No.8, Jakarta Selatan",
    notes: "Leading digital payment platform in Indonesia.",
    createdAt: "2023-06-01",
  },
  {
    id: "comp5",
    name: "Logistik Nusantara",
    industry: "Logistics",
    website: "https://logistik.co.id",
    phone: "+62 21-555-0500",
    address: "Jl. Cempaka Putih No.22, Jakarta Pusat",
    notes: "National logistics company. Cancelled subscription — budget cuts.",
    createdAt: "2022-12-08",
  },
  {
    id: "comp6",
    name: "Media Grup",
    industry: "Media & Entertainment",
    website: "https://mediagrup.id",
    phone: "+62 21-555-0600",
    address: "Jl. Casablanca No.15, Jakarta Selatan",
    notes: "Digital media conglomerate evaluating our platform.",
    createdAt: "2024-11-15",
  },
];

// ── Contacts ────────────────────────────────────────────────────────────────
export const CONTACTS: Contact[] = [
  {
    id: "c1",
    name: "Andi Prasetyo",
    email: "andi.prasetyo@techcorp.id",
    phone: "+62 812-3456-7890",
    companyId: "comp1",
    jobTitle: "CTO",
    status: "customer",
    notes: "Long-term enterprise client since 2022.",
    createdAt: "2022-03-10",
  },
  {
    id: "c2",
    name: "Sari Dewi",
    email: "sari.dewi@startup.io",
    phone: "+62 821-9876-5432",
    companyId: "comp2",
    jobTitle: "Head of Product",
    status: "prospect",
    notes: "Interested in the enterprise plan. Follow up next week.",
    createdAt: "2024-01-15",
  },
  {
    id: "c3",
    name: "Budi Santoso",
    email: "budi.santoso@retail.co.id",
    phone: "+62 878-1122-3344",
    companyId: "comp3",
    jobTitle: "IT Director",
    status: "lead",
    notes: "Met at Jakarta Tech Summit 2024.",
    createdAt: "2024-06-20",
  },
  {
    id: "c4",
    name: "Rina Wulandari",
    email: "rina@fintech.id",
    phone: "+62 857-5566-7788",
    companyId: "comp4",
    jobTitle: "VP of Engineering",
    status: "customer",
    notes: "Upgraded to premium tier in Q3 2024.",
    createdAt: "2023-08-05",
  },
  {
    id: "c5",
    name: "Dimas Kurniawan",
    email: "dimas@logistik.co.id",
    phone: "+62 813-9900-1122",
    companyId: "comp5",
    jobTitle: "Operations Manager",
    status: "churned",
    notes: "Cancelled subscription — budget cuts. Re-engage in 6 months.",
    createdAt: "2023-02-18",
  },
  {
    id: "c6",
    name: "Mega Lestari",
    email: "mega.lestari@mediagrup.id",
    phone: "+62 822-4433-5566",
    companyId: "comp6",
    jobTitle: "Digital Transformation Lead",
    status: "prospect",
    notes: "Evaluating vs competitor. Send case studies.",
    createdAt: "2025-01-08",
  },
];

// ── Leads ───────────────────────────────────────────────────────────────────
export const LEADS: Lead[] = [
  {
    id: "l1",
    title: "TechCorp Data Analytics Module",
    source: "referral",
    status: "qualified",
    contactId: "c1",
    companyId: "comp1",
    estimatedValue: 50_000_000,
    notes: "Andi referred internally. High interest in analytics dashboard.",
    createdAt: "2025-02-01",
  },
  {
    id: "l2",
    title: "StartupIO Team Expansion",
    source: "website",
    status: "contacted",
    contactId: "c2",
    companyId: "comp2",
    estimatedValue: 30_000_000,
    notes: "Signed up through website form. Demo scheduled.",
    createdAt: "2025-02-10",
  },
  {
    id: "l3",
    title: "Retail Co POS Integration",
    source: "event",
    status: "new",
    contactId: "c3",
    companyId: "comp3",
    estimatedValue: 25_000_000,
    notes: "Met at Indonesia Tech Expo 2025. Needs POS system integration.",
    createdAt: "2025-03-01",
  },
  {
    id: "l4",
    title: "Bank Mandiri Digital Onboarding",
    source: "cold_call",
    status: "contacted",
    contactId: null,
    companyId: null,
    estimatedValue: 100_000_000,
    notes: "Cold outreach to digital banking division. Awaiting callback.",
    createdAt: "2025-02-20",
  },
  {
    id: "l5",
    title: "Media Grup Content Platform",
    source: "social_media",
    status: "unqualified",
    contactId: "c6",
    companyId: "comp6",
    estimatedValue: 15_000_000,
    notes: "Budget too small for our minimum engagement. Revisit next quarter.",
    createdAt: "2025-01-25",
  },
];

// ── Deals ───────────────────────────────────────────────────────────────────
export const DEALS: Deal[] = [
  {
    id: "d1",
    title: "TechCorp Annual Renewal",
    value: 120_000_000,
    contactId: "c1",
    companyId: "comp1",
    stage: "closed_won",
    probability: 100,
    expectedCloseDate: "2025-03-31",
    notes: "Renewed for 2 years.",
    createdAt: "2025-01-15",
  },
  {
    id: "d2",
    title: "StartupIO Enterprise Plan",
    value: 45_000_000,
    contactId: "c2",
    companyId: "comp2",
    stage: "proposal",
    probability: 60,
    expectedCloseDate: "2025-04-15",
    notes: "Proposal sent, awaiting review.",
    createdAt: "2025-02-01",
  },
  {
    id: "d3",
    title: "Retail Co Pilot Program",
    value: 15_000_000,
    contactId: "c3",
    companyId: "comp3",
    stage: "prospecting",
    probability: 20,
    expectedCloseDate: "2025-05-01",
    notes: "Initial discovery call scheduled.",
    createdAt: "2025-02-20",
  },
  {
    id: "d4",
    title: "Fintech ID Premium Upgrade",
    value: 75_000_000,
    contactId: "c4",
    companyId: "comp4",
    stage: "closed_won",
    probability: 100,
    expectedCloseDate: "2024-09-30",
    notes: "Upgrade completed, onboarding done.",
    createdAt: "2024-07-10",
  },
  {
    id: "d5",
    title: "Logistik Nusantara Win-back",
    value: 30_000_000,
    contactId: "c5",
    companyId: "comp5",
    stage: "closed_lost",
    probability: 0,
    expectedCloseDate: "2025-02-28",
    notes: "Lost to competitor on pricing.",
    createdAt: "2024-12-01",
  },
  {
    id: "d6",
    title: "Media Grup Starter Package",
    value: 20_000_000,
    contactId: "c6",
    companyId: "comp6",
    stage: "negotiation",
    probability: 70,
    expectedCloseDate: "2025-04-30",
    notes: "Negotiating on seat count discount.",
    createdAt: "2025-01-20",
  },
  {
    id: "d7",
    title: "TechCorp Add-on Modules",
    value: 35_000_000,
    contactId: "c1",
    companyId: "comp1",
    stage: "proposal",
    probability: 50,
    expectedCloseDate: "2025-05-15",
    notes: "Upsell opportunity, good fit.",
    createdAt: "2025-03-01",
  },
];

// ── Tasks ───────────────────────────────────────────────────────────────────
export const TASKS: Task[] = [
  {
    id: "t1",
    title: "Follow up with Sari Dewi on enterprise plan",
    description: "Send updated pricing and case studies",
    status: "todo",
    priority: "high",
    dueDate: "2025-03-20",
    linkedEntityType: "contact",
    linkedEntityId: "c2",
    assignee: "Sales Team",
    createdAt: "2025-03-10",
  },
  {
    id: "t2",
    title: "Prepare TechCorp quarterly review deck",
    description: "Include usage metrics and upsell recommendations",
    status: "in_progress",
    priority: "high",
    dueDate: "2025-03-25",
    linkedEntityType: "company",
    linkedEntityId: "comp1",
    assignee: "Account Manager",
    createdAt: "2025-03-05",
  },
  {
    id: "t3",
    title: "Schedule demo for Retail Co",
    description: "Set up product demo for POS integration capabilities",
    status: "todo",
    priority: "medium",
    dueDate: "2025-03-22",
    linkedEntityType: "lead",
    linkedEntityId: "l3",
    assignee: "Sales Team",
    createdAt: "2025-03-08",
  },
  {
    id: "t4",
    title: "Send contract to Media Grup",
    description: "Final contract with negotiated seat discount",
    status: "todo",
    priority: "high",
    dueDate: "2025-03-18",
    linkedEntityType: "deal",
    linkedEntityId: "d6",
    assignee: "Legal",
    createdAt: "2025-03-12",
  },
  {
    id: "t5",
    title: "Update CRM with Fintech ID onboarding notes",
    description: "Document the onboarding process and key contacts",
    status: "done",
    priority: "low",
    dueDate: "2025-03-01",
    linkedEntityType: "company",
    linkedEntityId: "comp4",
    assignee: "Account Manager",
    createdAt: "2025-02-25",
  },
  {
    id: "t6",
    title: "Re-engagement campaign for Logistik Nusantara",
    description: "Plan re-engagement strategy after 6-month cool-down",
    status: "todo",
    priority: "medium",
    dueDate: "2025-04-15",
    linkedEntityType: "contact",
    linkedEntityId: "c5",
    assignee: "Marketing",
    createdAt: "2025-03-01",
  },
  {
    id: "t7",
    title: "Prepare Bank Mandiri proposal",
    description: "Draft proposal for digital onboarding solution",
    status: "in_progress",
    priority: "high",
    dueDate: "2025-03-28",
    linkedEntityType: "lead",
    linkedEntityId: "l4",
    assignee: "Sales Team",
    createdAt: "2025-03-05",
  },
  {
    id: "t8",
    title: "Collect testimonial from Andi Prasetyo",
    description: "Request written testimonial for marketing materials",
    status: "todo",
    priority: "low",
    dueDate: "2025-04-01",
    linkedEntityType: "contact",
    linkedEntityId: "c1",
    assignee: "Marketing",
    createdAt: "2025-03-10",
  },
];

// ── Notes ───────────────────────────────────────────────────────────────────
export const NOTES: Note[] = [
  {
    id: "n1",
    content:
      "Had a productive call with Andi. TechCorp is happy with the platform and open to expanding usage to other departments. Key concern: data migration from legacy systems.",
    linkedEntityType: "contact",
    linkedEntityId: "c1",
    createdAt: "2025-03-12",
  },
  {
    id: "n2",
    content:
      "Sari mentioned their team is growing from 20 to 50 engineers. This is a good upsell opportunity for the enterprise plan.",
    linkedEntityType: "contact",
    linkedEntityId: "c2",
    createdAt: "2025-03-08",
  },
  {
    id: "n3",
    content:
      "Media Grup wants a 15% discount on the starter package. They are comparing with two competitors. Need to emphasize our integration capabilities.",
    linkedEntityType: "deal",
    linkedEntityId: "d6",
    createdAt: "2025-03-10",
  },
  {
    id: "n4",
    content:
      "Retail Co has 50+ store locations. Potential for a large-scale POS integration project. Budi is the decision-maker but needs approval from the board.",
    linkedEntityType: "company",
    linkedEntityId: "comp3",
    createdAt: "2025-03-05",
  },
  {
    id: "n5",
    content:
      "Bank Mandiri digital banking division is undergoing digital transformation. They need a solution for customer onboarding. Budget is generous.",
    linkedEntityType: "lead",
    linkedEntityId: "l4",
    createdAt: "2025-02-22",
  },
  {
    id: "n6",
    content:
      "Fintech ID onboarding completed successfully. They are actively using the premium features. Schedule a check-in in 3 months.",
    linkedEntityType: "company",
    linkedEntityId: "comp4",
    createdAt: "2025-01-15",
  },
];

// ── Activities ──────────────────────────────────────────────────────────────
export const ACTIVITIES: Activity[] = [
  {
    id: "a1",
    type: "deal_stage_changed",
    description: "Deal 'TechCorp Annual Renewal' moved to Closed Won",
    linkedEntityType: "deal",
    linkedEntityId: "d1",
    metadata: { from: "negotiation", to: "closed_won" },
    createdAt: "2025-03-15",
  },
  {
    id: "a2",
    type: "note_added",
    description: "Note added for contact Andi Prasetyo",
    linkedEntityType: "contact",
    linkedEntityId: "c1",
    createdAt: "2025-03-12",
  },
  {
    id: "a3",
    type: "call",
    description: "Discovery call with Sari Dewi from StartupIO",
    linkedEntityType: "contact",
    linkedEntityId: "c2",
    createdAt: "2025-03-11",
  },
  {
    id: "a4",
    type: "email",
    description: "Sent proposal to StartupIO for Enterprise Plan",
    linkedEntityType: "deal",
    linkedEntityId: "d2",
    createdAt: "2025-03-10",
  },
  {
    id: "a5",
    type: "meeting",
    description: "Product demo with Retail Co team",
    linkedEntityType: "company",
    linkedEntityId: "comp3",
    createdAt: "2025-03-09",
  },
  {
    id: "a6",
    type: "note_added",
    description: "Note added for deal Media Grup Starter Package",
    linkedEntityType: "deal",
    linkedEntityId: "d6",
    createdAt: "2025-03-10",
  },
  {
    id: "a7",
    type: "deal_created",
    description: "New deal created: TechCorp Add-on Modules (Rp35.000.000)",
    linkedEntityType: "deal",
    linkedEntityId: "d7",
    createdAt: "2025-03-01",
  },
  {
    id: "a8",
    type: "task_completed",
    description: "Task completed: Update CRM with Fintech ID onboarding notes",
    linkedEntityType: "task",
    linkedEntityId: "t5",
    createdAt: "2025-03-01",
  },
  {
    id: "a9",
    type: "lead_status_changed",
    description: "Lead 'TechCorp Data Analytics Module' qualified",
    linkedEntityType: "lead",
    linkedEntityId: "l1",
    metadata: { from: "contacted", to: "qualified" },
    createdAt: "2025-02-28",
  },
  {
    id: "a10",
    type: "deal_stage_changed",
    description: "Deal 'Logistik Nusantara Win-back' moved to Closed Lost",
    linkedEntityType: "deal",
    linkedEntityId: "d5",
    metadata: { from: "negotiation", to: "closed_lost" },
    createdAt: "2025-02-28",
  },
  {
    id: "a11",
    type: "contact_created",
    description: "New contact created: Mega Lestari (Media Grup)",
    linkedEntityType: "contact",
    linkedEntityId: "c6",
    createdAt: "2025-01-08",
  },
  {
    id: "a12",
    type: "company_created",
    description: "New company added: Media Grup",
    linkedEntityType: "company",
    linkedEntityId: "comp6",
    createdAt: "2024-11-15",
  },
];

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
