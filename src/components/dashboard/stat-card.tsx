import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  iconColor?: string;
  subtitle?: string;
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = "text-indigo-500",
  subtitle,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold text-zinc-900 truncate">
              {value}
            </p>
            {subtitle && (
              <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>
            )}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-50",
              iconColor
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
