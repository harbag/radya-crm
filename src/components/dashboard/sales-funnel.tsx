"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/mock-data";

type FunnelStage = {
  stage: string;
  count: number;
  value: number;
};

const STAGE_COLORS = [
  "bg-blue-500",
  "bg-amber-500",
  "bg-orange-500",
  "bg-emerald-500",
  "bg-red-400",
];

export default function SalesFunnel({ data }: { data: FunnelStage[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Sales Pipeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((stage, i) => (
          <div key={stage.stage}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-700">{stage.stage}</span>
              <span className="text-zinc-500">
                {stage.count} deal{stage.count !== 1 ? "s" : ""} &middot;{" "}
                {formatCurrency(stage.value)}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-zinc-100">
              <div
                className={cn(
                  "h-3 rounded-full transition-all",
                  STAGE_COLORS[i % STAGE_COLORS.length]
                )}
                style={{
                  width: `${Math.max((stage.count / maxCount) * 100, 4)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
