"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { saveBippyVisibility } from "@/app/admin/actions/bippy";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export function BippyVisibilitySetting({ enabled }: { enabled: boolean }) {
  const [checked, setChecked] = useState(enabled);
  const [pending, startTransition] = useTransition();

  function updateVisibility(nextEnabled: boolean) {
    const previous = checked;
    setChecked(nextEnabled);

    startTransition(async () => {
      const result = await saveBippyVisibility({ enabled: nextEnabled });
      if (!result.ok) {
        setChecked(previous);
        toast.error(result.message);
        return;
      }

      toast.success(
        nextEnabled
          ? "Bippy is now visible publicly."
          : "Bippy is now hidden publicly.",
      );
    });
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Public visibility</CardTitle>
        <CardDescription>
          Show Bippy on the public homepage and projects page. The playground
          remains available here when Bippy is hidden.
        </CardDescription>
        <CardAction className="flex items-center gap-2">
          {pending ? (
            <LoaderCircle
              className="size-4 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          ) : null}
          <Switch
            id="public-bippy-enabled"
            checked={checked}
            disabled={pending}
            onCheckedChange={updateVisibility}
            aria-label="Show Bippy publicly"
          />
        </CardAction>
      </CardHeader>
    </Card>
  );
}
