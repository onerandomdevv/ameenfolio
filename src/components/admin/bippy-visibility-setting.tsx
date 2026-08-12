"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { saveBippyVisibility } from "@/app/admin/actions/bippy";
import { SectionHeading } from "@/components/admin/admin-primitives";
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
    // Last on the page, after the playground: this is the thing you touch once
    // you have decided he is ready to go out.
    <div className="mt-8 max-w-[720px]">
      <SectionHeading>Public site</SectionHeading>
      {/* One line at every width: the label is short and the switch belongs at
          the end of it, so the stacking a field row does would only add a
          break where none is needed. */}
      <div className="flex items-center gap-4 border-b border-border/60 py-3">
        <label
          htmlFor="public-bippy-enabled"
          className="text-[13px] whitespace-nowrap"
        >
          Show Bippy on the portfolio
        </label>
        <span className="ml-auto flex shrink-0 items-center gap-2">
          {pending ? (
            <LoaderCircle
              className="size-3.5 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          ) : null}
          <Switch
            id="public-bippy-enabled"
            checked={checked}
            disabled={pending}
            onCheckedChange={updateVisibility}
          />
        </span>
      </div>
    </div>
  );
}
