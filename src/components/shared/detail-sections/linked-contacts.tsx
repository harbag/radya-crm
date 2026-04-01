"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { Contact } from "@/lib/types";
import { STATUS_CONFIG } from "@/lib/mock-data";

export default function LinkedContacts({
  contacts,
}: {
  contacts: Contact[];
}) {
  if (contacts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-400">No contacts</p>
    );
  }

  return (
    <div className="space-y-2">
      {contacts.map((contact) => {
        const statusConfig = STATUS_CONFIG[contact.status];
        const initials = contact.name
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();

        return (
          <div
            key={contact.id}
            className="flex items-center gap-3 rounded-lg border border-zinc-100 p-2.5 hover:bg-zinc-50 transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-900 truncate">
                {contact.name}
              </p>
              <p className="text-xs text-zinc-500 truncate">
                {contact.jobTitle}
                {contact.email && ` · ${contact.email}`}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                statusConfig.className
              )}
            >
              {statusConfig.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
