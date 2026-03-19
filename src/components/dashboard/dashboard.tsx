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
import { useDealsStore } from "@/store/use-deals-store";
import { useCompaniesStore } from "@/store/use-companies-store";
import { useContactsStore } from "@/store/use-contacts-store";
import { useLeadsStore } from "@/store/use-leads-store";
import { useTasksStore } from "@/store/use-tasks-store";
import { useActivitiesStore } from "@/store/use-activities-store";
import { formatCurrency } from "@/lib/mock-data";
import { getAllActivitiesSorted } from "@/lib/entity-helpers";
import {
  calculateWinRate,
  calculateAvgDealSize,
  getTotalPipeline,
  getClosedWonTotal,
  getPipelineByStage,
  getTopClients,
  getDealsClosingSoon,
} from "@/lib/dashboard-helpers";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Dashboard() {
  const { deals } = useDealsStore();
  const { companies } = useCompaniesStore();
  const { contacts } = useContactsStore();
  const { leads } = useLeadsStore();
  const { tasks } = useTasksStore();
  const { activities } = useActivitiesStore();

  const totalPipeline = getTotalPipeline(deals);
  const closedWon = getClosedWonTotal(deals);
  const winRate = calculateWinRate(deals);
  const avgDealSize = calculateAvgDealSize(deals);
  const pipelineByStage = getPipelineByStage(deals);
  const topClients = getTopClients(deals, companies);
  const closingSoon = getDealsClosingSoon(deals);
  const recentActivities = getAllActivitiesSorted(activities).slice(0, 10);
  const openTasks = tasks.filter((t) => t.status !== "done").length;

  return (
    <div className="flex h-full flex-col bg-white">
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
              subtitle={`${deals.filter((d) => !["closed_won", "closed_lost"].includes(d.stage)).length} active`}
            />
            <StatCard
              label="Closed Won"
              value={formatCurrency(closedWon)}
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
              value={contacts.length.toString()}
              icon={Users}
              iconColor="text-indigo-500"
              subtitle={`${leads.length} leads`}
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
            <RecentActivities activities={recentActivities} />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
