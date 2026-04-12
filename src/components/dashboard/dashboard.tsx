"use client";

import React from "react";
import {
  DollarSign,
  TrendingUp,
  Target,
  BarChart3,
  CheckSquare,
  Users,
} from "lucide-react";
import StatCard from "./stat-card";
import SalesFunnel from "./sales-funnel";
import TopClients from "./top-clients";
import RecentActivities from "./recent-activities";
import DealsClosingSoon from "./deals-closing-soon";
import { useDealList, type DealRow } from "@/lib/queries/deals";
import { useCompanyList, type CompanyRow } from "@/lib/queries/companies";
import { useContactList } from "@/lib/queries/contacts";
import { useLeadList } from "@/lib/queries/leads";
import { useTaskList } from "@/lib/queries/tasks";
import { formatCurrency } from "@/lib/mock-data";
import type { Deal, Company } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GridSkeleton } from "@/components/shared/query-states";

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

function mapCompanyRow(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry ?? "",
    website: row.website ?? "",
    phone: row.phone ?? "",
    address: [row.address_city, row.address_province].filter(Boolean).join(", "),
    notes: "",
    logoUrl: row.logo_url ?? undefined,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    createdBy: row.created_by ?? "",
    lastModifiedAt: row.updated_at,
    lastModifiedBy: "",
  };
}

function getTopClients(
  dealRows: DealRow[],
  companyRows: CompanyRow[],
  limit = 5
): { company: Company; dealCount: number; totalValue: number }[] {
  const companyMap = new Map<string, { company: Company; dealCount: number; totalValue: number }>();
  const companies = companyRows.map(mapCompanyRow);

  for (const row of dealRows) {
    if (!row.company_id || row.is_archived) continue;
    const company = companies.find((c) => c.id === row.company_id);
    if (!company) continue;
    const existing = companyMap.get(row.company_id);
    if (existing) {
      existing.dealCount++;
      existing.totalValue += row.value;
    } else {
      companyMap.set(row.company_id, { company, dealCount: 1, totalValue: row.value });
    }
  }

  return Array.from(companyMap.values())
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, limit);
}

export default function Dashboard() {
  const { data: dealRows, isLoading: dealsLoading } = useDealList();
  const { data: companyRows } = useCompanyList();
  const { data: contactRows } = useContactList();
  const { data: leadRows } = useLeadList();
  const { data: taskRows } = useTaskList();

  if (dealsLoading) return <GridSkeleton />;

  const allDeals = dealRows ?? [];
  const openDeals = allDeals.filter((d) => d.status === "open" && !d.is_archived);
  const wonDeals = allDeals.filter((d) => d.status === "won");
  const lostDeals = allDeals.filter((d) => d.status === "lost");

  const totalPipeline = openDeals.reduce((s, d) => s + d.value, 0);
  const closedWonTotal = wonDeals.reduce((s, d) => s + d.value, 0);
  const totalClosed = wonDeals.length + lostDeals.length;
  const winRate = totalClosed === 0 ? 0 : Math.round((wonDeals.length / totalClosed) * 100);
  const avgDealSize = allDeals.length === 0 ? 0 : Math.round(allDeals.reduce((s, d) => s + d.value, 0) / allDeals.length);
  const openTasks = (taskRows ?? []).filter((t) => t.status === "open").length;

  // Sales funnel by status
  const pipelineByStage = [
    { stage: "Open", count: openDeals.length, value: totalPipeline },
    { stage: "Won", count: wonDeals.length, value: closedWonTotal },
    { stage: "Lost", count: lostDeals.length, value: lostDeals.reduce((s, d) => s + d.value, 0) },
  ];

  // Closing soon: open deals with expected_close_date within 30 days
  const now = new Date();
  const cutoff = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const closingSoon = openDeals
    .filter(
      (d) =>
        d.expected_close_date &&
        new Date(d.expected_close_date) >= now &&
        new Date(d.expected_close_date) <= cutoff
    )
    .sort((a, b) => new Date(a.expected_close_date!).getTime() - new Date(b.expected_close_date!).getTime())
    .slice(0, 8)
    .map(mapDealRow);

  const topClients = getTopClients(allDeals, companyRows ?? []);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 sm:px-6 sm:py-4">
        <div>
          <h1 className="text-base font-semibold text-zinc-900 sm:text-lg">Dashboard</h1>
          <p className="hidden text-sm text-zinc-500 sm:block">
            Overview of your sales pipeline and CRM activity
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4 sm:p-6 sm:space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Pipeline"
              value={formatCurrency(totalPipeline)}
              icon={BarChart3}
              iconColor="text-blue-500"
              subtitle={`${openDeals.length} active`}
            />
            <StatCard
              label="Closed Won"
              value={formatCurrency(closedWonTotal)}
              icon={DollarSign}
              iconColor="text-emerald-500"
            />
            <StatCard
              label="Win Rate"
              value={`${winRate}%`}
              icon={TrendingUp}
              iconColor="text-green-500"
            />
            <StatCard
              label="Avg Deal"
              value={formatCurrency(avgDealSize)}
              icon={Target}
              iconColor="text-amber-500"
            />
            <StatCard
              label="Contacts"
              value={(contactRows ?? []).length.toString()}
              icon={Users}
              iconColor="text-indigo-500"
              subtitle={`${(leadRows ?? []).length} leads`}
            />
            <StatCard
              label="Open Tasks"
              value={openTasks.toString()}
              icon={CheckSquare}
              iconColor="text-purple-500"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SalesFunnel data={pipelineByStage} />
            <TopClients clients={topClients} />
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DealsClosingSoon deals={closingSoon} />
            <RecentActivities activities={[]} />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
