"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Deal } from "@/lib/types";
import { formatCurrency, DEAL_STAGE_CONFIG } from "@/lib/mock-data";

export default function DealsClosingSoon({ deals }: { deals: Deal[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          Deals Closing Soon
        </CardTitle>
      </CardHeader>
      <CardContent>
        {deals.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-400">
            No deals closing soon
          </p>
        ) : (
          <div className="space-y-3">
            {deals.map((deal) => {
              const daysUntil = Math.ceil(
                (new Date(deal.expectedCloseDate).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              );
              const stageConfig = DEAL_STAGE_CONFIG[deal.stage];

              return (
                <div
                  key={deal.id}
                  className="flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {deal.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                          stageConfig.className
                        )}
                      >
                        {stageConfig.label}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {daysUntil <= 0
                          ? "Overdue"
                          : `${daysUntil}d left`}
                      </span>
                    </div>
                  </div>
                  <p className="ml-3 shrink-0 text-sm font-semibold text-zinc-700">
                    {formatCurrency(deal.value)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
