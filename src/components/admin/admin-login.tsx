"use client";

import { useState } from "react";
import { createAuthClient } from "@neondatabase/auth/next";
import { Github, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const auth = createAuthClient();

export function AdminLogin() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function signIn() {
    setPending(true);
    setError(undefined);
    const result = await auth.signIn.social({ provider: "github", callbackURL: "/admin/projects" });
    if (result?.error) {
      setError(result.error.message ?? "GitHub sign-in failed.");
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-sm border-white/10 bg-black/80">
      <CardHeader className="text-center">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent-lime">Owner access</p>
        <CardTitle className="mt-2 text-2xl">Portfolio admin</CardTitle>
        <CardDescription>Sign in with the authorized GitHub account to manage content.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="min-h-11 w-full bg-accent-lime font-bold text-black hover:bg-white" onClick={signIn} disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Github className="size-4" />}
          Continue with GitHub
        </Button>
        {error ? <p role="alert" className="mt-4 text-center text-sm text-red-400">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
