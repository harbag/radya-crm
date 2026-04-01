import type { Deal, Contact, Company, Lead, Task } from "./types";
import { formatCurrency } from "./mock-data";
import {
  calculateWinRate,
  calculateAvgDealSize,
  getTotalPipeline,
  getClosedWonTotal,
  getTopClients,
  getDealsClosingSoon,
} from "./dashboard-helpers";

type CrmData = {
  deals: Deal[];
  contacts: Contact[];
  companies: Company[];
  leads: Lead[];
  tasks: Task[];
};

export function generateResponse(query: string, data: CrmData): string {
  const q = query.toLowerCase().trim();

  // Pipeline
  if (q.includes("pipeline") || q.includes("total pipeline")) {
    const pipeline = getTotalPipeline(data.deals);
    const activeDeals = data.deals.filter(
      (d) => !["closed_won", "closed_lost"].includes(d.stage)
    );
    return `The total active pipeline is **${formatCurrency(pipeline)}** across **${activeDeals.length} deals**.`;
  }

  // Win rate
  if (q.includes("win rate") || q.includes("win-rate") || q.includes("conversion")) {
    const rate = calculateWinRate(data.deals);
    return `Your current win rate is **${rate}%**. This is calculated from ${data.deals.filter((d) => d.stage === "closed_won").length} won and ${data.deals.filter((d) => d.stage === "closed_lost").length} lost deals.`;
  }

  // Average deal
  if (q.includes("average") && q.includes("deal")) {
    const avg = calculateAvgDealSize(data.deals);
    return `The average deal size is **${formatCurrency(avg)}** across ${data.deals.length} total deals.`;
  }

  // Closed won / revenue
  if (q.includes("closed won") || q.includes("revenue") || q.includes("won")) {
    const total = getClosedWonTotal(data.deals);
    const count = data.deals.filter((d) => d.stage === "closed_won").length;
    return `Total closed-won revenue is **${formatCurrency(total)}** from **${count} deals**.`;
  }

  // Top clients
  if (q.includes("top client") || q.includes("top customer") || q.includes("biggest")) {
    const top = getTopClients(data.deals, data.companies, 5);
    if (top.length === 0) return "No client data available yet.";
    const lines = top.map(
      (c, i) =>
        `${i + 1}. **${c.company.name}** — ${formatCurrency(c.totalValue)} (${c.dealCount} deal${c.dealCount !== 1 ? "s" : ""})`
    );
    return `Top clients by total contract value:\n\n${lines.join("\n")}`;
  }

  // Tasks
  if (q.includes("task") || q.includes("todo")) {
    const open = data.tasks.filter((t) => t.status !== "done");
    const high = open.filter((t) => t.priority === "high");
    return `You have **${open.length} open tasks** (${high.length} high priority).\n\nHigh priority tasks:\n${high.map((t) => `- ${t.title}`).join("\n") || "None"}`;
  }

  // Contacts
  if (q.includes("contact") || q.includes("how many people")) {
    const byStatus = {
      customer: data.contacts.filter((c) => c.status === "customer").length,
      prospect: data.contacts.filter((c) => c.status === "prospect").length,
      lead: data.contacts.filter((c) => c.status === "lead").length,
      churned: data.contacts.filter((c) => c.status === "churned").length,
    };
    return `You have **${data.contacts.length} contacts**:\n- ${byStatus.customer} customers\n- ${byStatus.prospect} prospects\n- ${byStatus.lead} leads\n- ${byStatus.churned} churned`;
  }

  // Leads
  if (q.includes("lead") && !q.includes("contact")) {
    const qualified = data.leads.filter((l) => l.status === "qualified");
    return `You have **${data.leads.length} leads** total. **${qualified.length}** are qualified.\n\nQualified leads:\n${qualified.map((l) => `- ${l.title} (${formatCurrency(l.estimatedValue)})`).join("\n") || "None"}`;
  }

  // Deals closing soon
  if (q.includes("closing") || q.includes("upcoming") || q.includes("soon")) {
    const closing = getDealsClosingSoon(data.deals, 30);
    if (closing.length === 0)
      return "No deals closing in the next 30 days.";
    const lines = closing.map((d) => {
      const days = Math.ceil(
        (new Date(d.expectedCloseDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );
      return `- **${d.title}** — ${formatCurrency(d.value)} (${days}d)`;
    });
    return `Deals closing in the next 30 days:\n\n${lines.join("\n")}`;
  }

  // Companies
  if (q.includes("company") || q.includes("companies") || q.includes("organization")) {
    return `You have **${data.companies.length} companies** in your CRM:\n${data.companies.map((c) => `- ${c.name} (${c.industry})`).join("\n")}`;
  }

  // Help / default
  return `I can help you with data questions about your CRM. Try asking about:\n\n- **Pipeline** — total pipeline value\n- **Win rate** — deal conversion rate\n- **Top clients** — highest-value customers\n- **Tasks** — open tasks and priorities\n- **Contacts** — contact breakdown\n- **Leads** — lead status\n- **Deals closing soon** — upcoming closes`;
}
