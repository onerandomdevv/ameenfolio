"use client";

import { createAuthClient } from "@neondatabase/auth/next";
import { useRouter } from "next/navigation";
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
    <button
      type="button"
      onClick={signOut}
      className="inline-flex h-8 items-center rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      Sign out
    </button>
  );
}
