"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { Deal } from "@/lib/types";
import { DEAL_STAGE_CONFIG, formatCurrency } from "@/lib/mock-data";

export default function LinkedDeals({ deals }: { deals: Deal[] }) {
  if (deals.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-400">No deals</p>
    );
  }

  const total = deals.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-500">
          {deals.length} deal{deals.length !== 1 ? "s" : ""}
        </span>
        <span className="font-semibold text-zinc-900">
          {formatCurrency(total)}
        </span>
      </div>
      {deals.map((deal) => {
        const stageConfig = DEAL_STAGE_CONFIG[deal.stage];
        return (
          <div
            key={deal.id}
            className="flex items-center justify-between rounded-lg border border-zinc-100 p-3 hover:bg-zinc-50 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-900 truncate">
                {deal.title}
              </p>
              <span
                className={cn(
                  "mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                  stageConfig.className
                )}
              >
                {stageConfig.label}
              </span>
            </div>
            <p className="ml-3 text-sm font-semibold text-zinc-700">
              {formatCurrency(deal.value)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
