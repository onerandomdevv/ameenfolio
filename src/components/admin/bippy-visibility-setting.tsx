"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { saveBippyVisibility } from "@/app/admin/actions/bippy";
import { Label } from "@/components/ui/label";
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
    // One row, one label, one switch. The previous copy explained where Bippy
    // appears and what the playground still does when it is off — none of
    // which the person flipping their own toggle needs told.
    <div className="mb-8 flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 sm:px-5">
      <Label htmlFor="public-bippy-enabled" className="text-sm font-medium">
        Show Bippy on the portfolio
      </Label>
      <div className="flex shrink-0 items-center gap-2">
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
        />
      </div>
    </div>
  );
}
