"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="flex w-full max-w-lg flex-col gap-4">
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            The portfolio could not be loaded. Please try again.
          </AlertDescription>
        </Alert>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
