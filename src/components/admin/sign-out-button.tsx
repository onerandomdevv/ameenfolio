"use client";

import { createAuthClient } from "@neondatabase/auth/next";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAdminBase } from "@/lib/use-admin-base";

const auth = createAuthClient();

export function SignOutButton() {
  const router = useRouter();
  const base = useAdminBase();

  async function signOut() {
    await auth.signOut();
    router.replace(`${base}/login`);
    router.refresh();
  }

  return (
    // Shaped like the sidebar links beside it, including the icon-only form on
    // the narrow rail, so the footer reads as part of the same list.
    <button
      type="button"
      onClick={signOut}
      className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground max-lg:justify-center max-lg:px-0"
    >
      <LogOut className="size-4 shrink-0" aria-hidden="true" />
      <span className="max-lg:sr-only">Sign out</span>
    </button>
  );
}
