"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Admin request failed</AlertTitle>
        <AlertDescription>
          The operation was logged on the server. Try the request again.
        </AlertDescription>
      </Alert>
      <Button className="self-start" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}
