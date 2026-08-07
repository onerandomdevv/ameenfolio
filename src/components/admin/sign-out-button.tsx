"use client";

import { createAuthClient } from "@neondatabase/auth/next";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const auth = createAuthClient();

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
      <LogOut data-icon="inline-start" />
      Sign out
    </Button>
  );
}
