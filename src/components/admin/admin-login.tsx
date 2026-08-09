"use client";

import { useState } from "react";
import { createAuthClient } from "@neondatabase/auth/next";
import { LoaderCircle } from "lucide-react";
import { GitHubIcon } from "@/components/icons/brand-icons";
import { Button } from "@/components/ui/button";
import { useAdminBase } from "@/lib/use-admin-base";

const auth = createAuthClient();

export function AdminLogin() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const base = useAdminBase();

  async function signIn() {
    setPending(true);
    setError(undefined);
    const result = await auth.signIn.social({
      provider: "github",
      callbackURL: new URL(
        `${base}/projects`,
        window.location.origin,
      ).toString(),
    });

    if (result?.error) {
      setError(result.error.message ?? "GitHub sign-in failed.");
      setPending(false);
    }
  }

  return (
    // A panel rather than bare text on the page: sign-in is the one screen
    // that is only a form, and a card gives it an edge to sit against.
    <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 sm:p-7">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        Admin
      </p>
      <h1 className="mt-3 text-lg font-semibold tracking-[-0.01em] text-foreground">
        Sign in
      </h1>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Use the authorized GitHub account to manage content.
      </p>

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <Button className="mt-6 w-full" onClick={signIn} disabled={pending}>
        {pending ? (
          <LoaderCircle data-icon="inline-start" className="animate-spin" />
        ) : (
          <GitHubIcon data-icon="inline-start" aria-hidden="true" />
        )}
        Continue with GitHub
      </Button>
    </div>
  );
}
