"use client";

import { createAuthClient } from "@neondatabase/auth/next";
import { useRouter } from "next/navigation";

const auth = createAuthClient();

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="inline-flex min-h-11 items-center text-muted-foreground transition-colors hover:text-foreground"
    >
      Sign out
    </button>
  );
}
