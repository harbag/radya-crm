"use client";

import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUserStore } from "@/store/use-user-store";
import { useThemeStore, type Theme } from "@/store/use-theme-store";
import { cn } from "@/lib/utils";
import { Sun, Moon, Monitor, LogOut, User, ChevronUp } from "lucide-react";

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function UserMenu({ collapsed }: { collapsed: boolean }) {
  const user = useUserStore((s) => s.user);
  const { theme, setTheme } = useThemeStore();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors",
            "hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60",
            collapsed && "justify-center"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
            {getInitials(user.name)}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {user.name}
                </p>
                <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                  {user.role}
                </p>
              </div>
              <ChevronUp className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-56 p-1"
      >
        {/* User info */}
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {user.name}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {user.email}
          </p>
        </div>

        <div className="my-1 h-px bg-zinc-200 dark:bg-zinc-700" />

        {/* Profile */}
        <button className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700">
          <User className="h-3.5 w-3.5" />
          My Profile
        </button>

        <div className="my-1 h-px bg-zinc-200 dark:bg-zinc-700" />

        {/* Theme */}
        <div className="px-3 py-1.5">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Theme
          </p>
          <div className="flex gap-1">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-md px-2 py-1.5 text-[11px] transition-colors",
                  theme === value
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                    : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="my-1 h-px bg-zinc-200 dark:bg-zinc-700" />

        {/* Logout */}
        <button className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
          <LogOut className="h-3.5 w-3.5" />
          Log out
        </button>
      </PopoverContent>
    </Popover>
  );
}
