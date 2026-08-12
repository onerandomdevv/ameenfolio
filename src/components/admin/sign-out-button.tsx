"use client";

import { createAuthClient } from "@neondatabase/auth/next";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAdminBase } from "@/lib/use-admin-base";
import { cn } from "@/lib/utils";

const auth = createAuthClient();

// `compact` is the top bar's form: it sits in a row of controls rather than a
// column of links, so it shrinks to its own width instead of filling one.
export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const base = useAdminBase();

  async function signOut() {
    await auth.signOut();
    router.replace(`${base}/login`);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className={cn(
        "flex h-9 items-center gap-2 rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        compact
          ? "h-8 shrink-0 px-2 text-[13px]"
          : "w-full gap-2.5 px-2.5 text-sm",
      )}
    >
      <LogOut className="size-4 shrink-0" aria-hidden="true" />
      Sign out
    </button>
  );
}
