"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { Activity } from "@/lib/types";
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckCircle,
  TrendingUp,
  ArrowRightLeft,
  UserPlus,
  Building2,
} from "lucide-react";

const ACTIVITY_ICONS: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note_added: FileText,
  task_completed: CheckCircle,
  deal_created: TrendingUp,
  deal_stage_changed: ArrowRightLeft,
  lead_status_changed: ArrowRightLeft,
  contact_created: UserPlus,
  company_created: Building2,
};

const ACTIVITY_COLORS: Record<string, string> = {
  call: "bg-blue-100 text-blue-600",
  email: "bg-green-100 text-green-600",
  meeting: "bg-purple-100 text-purple-600",
  note_added: "bg-yellow-100 text-yellow-600",
  task_completed: "bg-emerald-100 text-emerald-600",
  deal_created: "bg-indigo-100 text-indigo-600",
  deal_stage_changed: "bg-orange-100 text-orange-600",
  lead_status_changed: "bg-amber-100 text-amber-600",
  contact_created: "bg-cyan-100 text-cyan-600",
  company_created: "bg-teal-100 text-teal-600",
};

export default function ActivityFeed({
  activities,
}: {
  activities: Activity[];
}) {
  if (activities.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-400">
        No activities yet
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const Icon = ACTIVITY_ICONS[activity.type] ?? FileText;
        const colorClass =
          ACTIVITY_COLORS[activity.type] ?? "bg-zinc-100 text-zinc-600";

        return (
          <div key={activity.id} className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                colorClass
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-700">{activity.description}</p>
              <p className="text-xs text-zinc-400">
                {new Date(activity.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
