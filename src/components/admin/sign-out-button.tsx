"use client";

import { createAuthClient } from "@neondatabase/auth/next";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const auth = createAuthClient();

export function SignOutButton() { return <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={async () => { await auth.signOut(); window.location.assign("/admin/login"); }}><LogOut className="size-4" />Sign out</Button>; }
