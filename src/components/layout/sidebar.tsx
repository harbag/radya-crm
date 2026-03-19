"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  KanbanSquare,
  Building2,
  Target,
  CheckSquare,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeft,
  X,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/use-sidebar-store";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/leads", label: "Leads", icon: Target },
  { href: "/deals", label: "Deals Pipeline", icon: KanbanSquare },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
];

function SidebarContent({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <>
      {/* Nav section */}
      <div className="flex-1 overflow-y-auto py-3">
        <p
          className={cn(
            "mb-1 px-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 transition-opacity",
            collapsed && "opacity-0"
          )}
        >
          Modules
        </p>
        <nav className="px-2 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200",
                  collapsed && "justify-center px-0"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-indigo-400" : "text-zinc-500"
                  )}
                />
                {!collapsed && label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div
        className={cn(
          "border-t border-zinc-800 px-4 py-3",
          collapsed && "px-2"
        )}
      >
        {!collapsed && (
          <p className="text-xs text-zinc-600">Radya CRM v0.1.0</p>
        )}
      </div>
    </>
  );
}

/** Desktop sidebar: collapsible */
export function DesktopSidebar() {
  const { collapsed, toggle } = useSidebarStore();

  return (
    <aside
      className={cn(
        "hidden md:flex shrink-0 flex-col bg-zinc-900 border-r border-zinc-800 transition-all duration-200",
        collapsed ? "w-14" : "w-60"
      )}
    >
      {/* Logo + collapse toggle */}
      <div className="flex h-14 items-center border-b border-zinc-800 px-3">
        {!collapsed && (
          <div className="flex flex-1 items-center gap-3 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500 shrink-0">
              <span className="text-xs font-bold text-white">R</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-100 truncate">
                Radya CRM
              </p>
              <p className="text-xs text-zinc-500 truncate">Radya Group</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500 shrink-0 mx-auto">
            <span className="text-xs font-bold text-white">R</span>
          </div>
        )}
        <button
          onClick={toggle}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors shrink-0",
            collapsed && "absolute right-1 top-3.5"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      <SidebarContent collapsed={collapsed} />
    </aside>
  );
}

/** Mobile sidebar: overlay */
export function MobileSidebar() {
  const { mobileOpen, closeMobile } = useSidebarStore();

  return (
    <>
      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-zinc-900 border-r border-zinc-800 transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo + close */}
        <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500 shrink-0">
              <span className="text-xs font-bold text-white">R</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-100 truncate">
                Radya CRM
              </p>
              <p className="text-xs text-zinc-500 truncate">Radya Group</p>
            </div>
          </div>
          <button
            onClick={closeMobile}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <MobileSidebarNav />
      </aside>
    </>
  );
}

/** Mobile nav that closes on link click */
function MobileSidebarNav() {
  const pathname = usePathname();
  const { closeMobile } = useSidebarStore();

  return (
    <>
      <div className="flex-1 overflow-y-auto py-3">
        <p className="mb-1 px-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
          Modules
        </p>
        <nav className="px-2 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={closeMobile}
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
      <div className="border-t border-zinc-800 px-4 py-3">
        <p className="text-xs text-zinc-600">Radya CRM v0.1.0</p>
      </div>
    </>
  );
}

/** Mobile top bar with hamburger menu */
export function MobileTopBar() {
  const { openMobile } = useSidebarStore();

  return (
    <div className="flex h-12 items-center gap-3 border-b border-zinc-200 bg-white px-3 md:hidden">
      <button
        onClick={openMobile}
        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500">
          <span className="text-[10px] font-bold text-white">R</span>
        </div>
        <span className="text-sm font-semibold text-zinc-900">Radya CRM</span>
      </div>
    </div>
  );
}

// Default export for backward compat (used nowhere now, but just in case)
export default function Sidebar() {
  return <DesktopSidebar />;
}
