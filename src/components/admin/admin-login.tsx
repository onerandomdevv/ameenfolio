"use client";

import { useState } from "react";
import { createAuthClient } from "@neondatabase/auth/next";
import { Github, LoaderCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
        "/admin/projects",
        window.location.origin,
      ).toString(),
    });

    if (result?.error) {
      setError(result.error.message ?? "GitHub sign-in failed.");
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Owner access
        </p>
        <CardTitle className="mt-2">
          <h1 className="text-2xl">Portfolio admin</h1>
        </CardTitle>
        <CardDescription>
          Sign in with the authorized GitHub account to manage content.
        </CardDescription>
      </CardHeader>
      {error ? (
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Sign-in failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      ) : null}
      <CardFooter>
        <Button className="w-full" onClick={signIn} disabled={pending}>
          {pending ? (
            <LoaderCircle data-icon="inline-start" className="animate-spin" />
          ) : (
            <Github data-icon="inline-start" />
          )}
          Continue with GitHub
        </Button>
      </CardFooter>
    </Card>
  );
}
