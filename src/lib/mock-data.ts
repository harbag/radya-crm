export type ContactStatus = "lead" | "prospect" | "customer" | "churned";

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: ContactStatus;
  notes: string;
  createdAt: string;
};

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
  stage: DealStage;
  expectedCloseDate: string;
  notes: string;
};

export const CONTACTS: Contact[] = [
  {
    id: "c1",
    name: "Andi Prasetyo",
    email: "andi.prasetyo@techcorp.id",
    phone: "+62 812-3456-7890",
    company: "TechCorp Indonesia",
    status: "customer",
    notes: "Long-term enterprise client since 2022.",
    createdAt: "2022-03-10",
  },
  {
    id: "c2",
    name: "Sari Dewi",
    email: "sari.dewi@startup.io",
    phone: "+62 821-9876-5432",
    company: "StartupIO",
    status: "prospect",
    notes: "Interested in the enterprise plan. Follow up next week.",
    createdAt: "2024-01-15",
  },
  {
    id: "c3",
    name: "Budi Santoso",
    email: "budi.santoso@retail.co.id",
    phone: "+62 878-1122-3344",
    company: "Retail Co",
    status: "lead",
    notes: "Met at Jakarta Tech Summit 2024.",
    createdAt: "2024-06-20",
  },
  {
    id: "c4",
    name: "Rina Wulandari",
    email: "rina@fintech.id",
    phone: "+62 857-5566-7788",
    company: "Fintech ID",
    status: "customer",
    notes: "Upgraded to premium tier in Q3 2024.",
    createdAt: "2023-08-05",
  },
  {
    id: "c5",
    name: "Dimas Kurniawan",
    email: "dimas@logistik.co.id",
    phone: "+62 813-9900-1122",
    company: "Logistik Nusantara",
    status: "churned",
    notes: "Cancelled subscription — budget cuts. Re-engage in 6 months.",
    createdAt: "2023-02-18",
  },
  {
    id: "c6",
    name: "Mega Lestari",
    email: "mega.lestari@mediagrup.id",
    phone: "+62 822-4433-5566",
    company: "Media Grup",
    status: "prospect",
    notes: "Evaluating vs competitor. Send case studies.",
    createdAt: "2025-01-08",
  },
];

export const DEALS: Deal[] = [
  {
    id: "d1",
    title: "TechCorp Annual Renewal",
    value: 120_000_000,
    contactId: "c1",
    stage: "closed_won",
    expectedCloseDate: "2025-03-31",
    notes: "Renewed for 2 years.",
  },
  {
    id: "d2",
    title: "StartupIO Enterprise Plan",
    value: 45_000_000,
    contactId: "c2",
    stage: "proposal",
    expectedCloseDate: "2025-04-15",
    notes: "Proposal sent, awaiting review.",
  },
  {
    id: "d3",
    title: "Retail Co Pilot Program",
    value: 15_000_000,
    contactId: "c3",
    stage: "prospecting",
    expectedCloseDate: "2025-05-01",
    notes: "Initial discovery call scheduled.",
  },
  {
    id: "d4",
    title: "Fintech ID Premium Upgrade",
    value: 75_000_000,
    contactId: "c4",
    stage: "closed_won",
    expectedCloseDate: "2024-09-30",
    notes: "Upgrade completed, onboarding done.",
  },
  {
    id: "d5",
    title: "Logistik Nusantara Win-back",
    value: 30_000_000,
    contactId: "c5",
    stage: "closed_lost",
    expectedCloseDate: "2025-02-28",
    notes: "Lost to competitor on pricing.",
  },
  {
    id: "d6",
    title: "Media Grup Starter Package",
    value: 20_000_000,
    contactId: "c6",
    stage: "negotiation",
    expectedCloseDate: "2025-04-30",
    notes: "Negotiating on seat count discount.",
  },
  {
    id: "d7",
    title: "TechCorp Add-on Modules",
    value: 35_000_000,
    contactId: "c1",
    stage: "proposal",
    expectedCloseDate: "2025-05-15",
    notes: "Upsell opportunity, good fit.",
  },
];

export const DEAL_STAGES: { id: DealStage; label: string }[] = [
  { id: "prospecting", label: "Prospecting" },
  { id: "proposal", label: "Proposal Sent" },
  { id: "negotiation", label: "Negotiation" },
  { id: "closed_won", label: "Closed Won" },
  { id: "closed_lost", label: "Closed Lost" },
];

export const STATUS_CONFIG: Record<
  ContactStatus,
  { label: string; className: string }
> = {
  lead: { label: "Lead", className: "bg-blue-100 text-blue-700" },
  prospect: { label: "Prospect", className: "bg-yellow-100 text-yellow-700" },
  customer: { label: "Customer", className: "bg-green-100 text-green-700" },
  churned: { label: "Churned", className: "bg-red-100 text-red-700" },
};

export function getContactById(id: string): Contact | undefined {
  return CONTACTS.find((c) => c.id === id);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
