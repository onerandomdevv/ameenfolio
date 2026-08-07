"use client";

import { createAuthClient } from "@neondatabase/auth/next";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const auth = createAuthClient();

export function SignOutButton() {
  async function signOut() {
    await auth.signOut();
    window.location.assign("/admin/login");
  }

  return (
    <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
      <LogOut data-icon="inline-start" />
      Sign out
    </Button>
  );
}
