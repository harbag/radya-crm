import type { Deal, Company } from "./types";
import { formatCurrency } from "./mock-data";

export function calculateWinRate(deals: Deal[]): number {
  const closedWon = deals.filter((d) => d.stage === "closed_won").length;
  const closedLost = deals.filter((d) => d.stage === "closed_lost").length;
  const total = closedWon + closedLost;
  return total === 0 ? 0 : Math.round((closedWon / total) * 100);
}

export function calculateAvgDealSize(deals: Deal[]): number {
  if (deals.length === 0) return 0;
  return Math.round(deals.reduce((s, d) => s + d.value, 0) / deals.length);
}

export function getTotalPipeline(deals: Deal[]): number {
  return deals
    .filter((d) => d.stage !== "closed_won" && d.stage !== "closed_lost")
    .reduce((s, d) => s + d.value, 0);
}

export function getClosedWonTotal(deals: Deal[]): number {
  return deals
    .filter((d) => d.stage === "closed_won")
    .reduce((s, d) => s + d.value, 0);
}

export function getPipelineByStage(
  deals: Deal[]
): { stage: string; count: number; value: number }[] {
  const stages = ["prospecting", "proposal", "negotiation", "closed_won", "closed_lost"];
  const stageLabels: Record<string, string> = {
    prospecting: "Prospecting",
    proposal: "Proposal",
    negotiation: "Negotiation",
    closed_won: "Won",
    closed_lost: "Lost",
  };

  return stages.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage);
    return {
      stage: stageLabels[stage] || stage,
      count: stageDeals.length,
      value: stageDeals.reduce((s, d) => s + d.value, 0),
    };
  });
}

export function getTopClients(
  deals: Deal[],
  companies: Company[],
  limit = 5
): { company: Company; dealCount: number; totalValue: number }[] {
  const companyMap = new Map<
    string,
    { company: Company; dealCount: number; totalValue: number }
  >();

  for (const deal of deals) {
    if (!deal.companyId) continue;
    const company = companies.find((c) => c.id === deal.companyId);
    if (!company) continue;

    const existing = companyMap.get(deal.companyId);
    if (existing) {
      existing.dealCount++;
      existing.totalValue += deal.value;
    } else {
      companyMap.set(deal.companyId, {
        company,
        dealCount: 1,
        totalValue: deal.value,
      });
    }
  }

  return Array.from(companyMap.values())
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, limit);
}

export function getDealsClosingSoon(
  deals: Deal[],
  days = 30
): Deal[] {
  const now = new Date();
  const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return deals
    .filter(
      (d) =>
        d.stage !== "closed_won" &&
        d.stage !== "closed_lost" &&
        new Date(d.expectedCloseDate) <= cutoff &&
        new Date(d.expectedCloseDate) >= now
    )
    .sort(
      (a, b) =>
        new Date(a.expectedCloseDate).getTime() -
        new Date(b.expectedCloseDate).getTime()
    );
}
