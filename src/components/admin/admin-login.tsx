"use client";

import { useState } from "react";
import { createAuthClient } from "@neondatabase/auth/next";
import { LoaderCircle } from "lucide-react";
import { instrumentSerif } from "@/app/fonts";
import { Button } from "@/components/ui/button";

const auth = createAuthClient();

export function AdminLogin() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function signIn() {
    setPending(true);
    setError(undefined);
    const result = await auth.signIn.social({
      provider: "github",
      callbackURL: new URL(
        "/",
        window.location.origin,
      ).toString(),
    });

    if (result?.error) {
      setError(result.error.message ?? "GitHub sign-in failed.");
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1
        className={`${instrumentSerif.className} text-3xl leading-none tracking-[-0.02em] text-foreground`}
      >
        Portfolio admin
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in with the authorized GitHub account to manage content.
      </p>

      {error ? (
        <p role="alert" className="mt-6 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button className="mt-8 w-full" onClick={signIn} disabled={pending}>
        {pending ? (
          <LoaderCircle data-icon="inline-start" className="animate-spin" />
        ) : null}
        Continue with GitHub
      </Button>
    </div>
  );
}
