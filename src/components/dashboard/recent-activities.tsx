"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

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
  call: "text-blue-500",
  email: "text-green-500",
  meeting: "text-purple-500",
  note_added: "text-yellow-500",
  task_completed: "text-emerald-500",
  deal_created: "text-indigo-500",
  deal_stage_changed: "text-orange-500",
  lead_status_changed: "text-amber-500",
  contact_created: "text-cyan-500",
  company_created: "text-teal-500",
};

export default function RecentActivities({
  activities,
}: {
  activities: Activity[];
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-400">
            No recent activity
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.type] ?? FileText;
              const color =
                ACTIVITY_COLORS[activity.type] ?? "text-zinc-500";

              return (
                <div key={activity.id} className="flex items-start gap-2.5">
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", color)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-700 leading-snug">
                      {activity.description}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      {new Date(activity.createdAt).toLocaleDateString(
                        "en-GB",
                        { day: "numeric", month: "short" }
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
