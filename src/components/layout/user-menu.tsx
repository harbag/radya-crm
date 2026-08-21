"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useThemeStore, type Theme } from "@/store/use-theme-store";
import {
  useCurrentUser,
  useUpdateCurrentUser,
} from "@/hooks/use-current-user";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Sun,
  Moon,
  Monitor,
  LogOut,
  User,
  ChevronUp,
  KeyRound,
} from "lucide-react";

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function getInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "?";
}

function formatRole(role?: string) {
  if (!role) return "Loading…";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function UserMenu({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser, error: profileQueryError } = useCurrentUser();
  const updateProfile = useUpdateCurrentUser();
  const { theme, setTheme } = useThemeStore();

  const [profileDialogOpen, setProfileDialogOpen] = React.useState(false);
  const [displayName, setDisplayName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [profileError, setProfileError] = React.useState<string | null>(null);
  const [profileMessage, setProfileMessage] = React.useState<string | null>(null);

  const [passwordDialogOpen, setPasswordDialogOpen] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = React.useState<string | null>(null);
  const [updatingPassword, setUpdatingPassword] = React.useState(false);

  const [loggingOut, setLoggingOut] = React.useState(false);
  const [logoutError, setLogoutError] = React.useState<string | null>(null);

  const name = currentUser?.fullName || "Account";
  const email = currentUser?.email || "";

  function openProfileDialog() {
    setDisplayName(currentUser?.fullName ?? "");
    setPhone(currentUser?.phone ?? "");
    setProfileError(null);
    setProfileMessage(null);
    setProfileDialogOpen(true);
  }

  async function handleProfileUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError(null);
    setProfileMessage(null);

    if (!displayName.trim()) {
      setProfileError("Display name is required.");
      return;
    }

    try {
      await updateProfile.mutateAsync({
        fullName: displayName,
        phone: phone || null,
      });
      setProfileMessage("Your profile has been updated.");
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "Unable to update your profile."
      );
    }
  }

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmation) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setUpdatingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setNewPassword("");
      setConfirmation("");
      setPasswordMessage("Your password has been changed.");
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : "Unable to change password."
      );
    } finally {
      setUpdatingPassword(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : "Unable to log out."
      );
      setLoggingOut(false);
    }
  }

  return (
    <>
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
              {getInitials(name)}
            </div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {name}
                  </p>
                  <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                    {formatRole(currentUser?.role)}
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
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {name}
            </p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {email || "Loading profile…"}
            </p>
            {profileQueryError && (
              <p className="mt-1 text-xs text-red-600">
                Unable to load the Supabase profile.
              </p>
            )}
          </div>

          <div className="my-1 h-px bg-zinc-200 dark:bg-zinc-700" />

          <button
            onClick={openProfileDialog}
            disabled={!currentUser}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <User className="h-3.5 w-3.5" />
            My Profile
          </button>
          <button
            onClick={() => {
              setPasswordDialogOpen(true);
              setPasswordError(null);
              setPasswordMessage(null);
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Change password
          </button>

          <div className="my-1 h-px bg-zinc-200 dark:bg-zinc-700" />

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

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <LogOut className="h-3.5 w-3.5" />
            {loggingOut ? "Logging out…" : "Log out"}
          </button>
          {logoutError && (
            <p className="px-3 py-1 text-xs text-red-600">{logoutError}</p>
          )}
        </PopoverContent>
      </Popover>

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>My Profile</DialogTitle>
            <DialogDescription>
              View your account and update your CRM profile information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="profile-email" className="text-sm font-medium">
                Email
              </label>
              <Input id="profile-email" type="email" value={email} disabled />
              <p className="text-xs text-muted-foreground">
                Email changes are managed through Supabase Authentication.
              </p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="profile-display-name" className="text-sm font-medium">
                Display name
              </label>
              <Input
                id="profile-display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="profile-phone" className="text-sm font-medium">
                Phone
              </label>
              <Input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+62…"
                autoComplete="tel"
              />
            </div>
            <div className="rounded-md bg-muted px-3 py-2 text-sm">
              <span className="text-muted-foreground">Role: </span>
              <span className="font-medium">{formatRole(currentUser?.role)}</span>
            </div>
            {profileError && (
              <p className="text-sm text-destructive">{profileError}</p>
            )}
            {profileMessage && (
              <p className="text-sm text-green-700 dark:text-green-400">
                {profileMessage}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Enter a new password with at least 8 characters.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="menu-new-password" className="text-sm font-medium">
                New password
              </label>
              <Input
                id="menu-new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="menu-confirm-password"
                className="text-sm font-medium"
              >
                Confirm new password
              </label>
              <Input
                id="menu-confirm-password"
                type="password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            {passwordMessage && (
              <p className="text-sm text-green-700 dark:text-green-400">
                {passwordMessage}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={updatingPassword}>
                {updatingPassword ? "Updating…" : "Update password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
