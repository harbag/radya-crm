"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, KanbanSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/deals", label: "Deals Pipeline", icon: KanbanSquare },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-zinc-900 border-r border-zinc-800">
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b border-zinc-800 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500 shrink-0">
          <span className="text-xs font-bold text-white">R</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-100 truncate">Radya CRM</p>
          <p className="text-xs text-zinc-500 truncate">Radya Group</p>
        </div>
      </div>

      {/* Nav section */}
      <div className="flex-1 overflow-y-auto py-3">
        <p className="mb-1 px-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
          Modules
        </p>
        <nav className="px-2 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-indigo-400" : "text-zinc-500"
                  )}
                />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 px-4 py-3">
        <p className="text-xs text-zinc-600">Radya CRM v0.1.0</p>
      </div>
    </aside>
  );
}
