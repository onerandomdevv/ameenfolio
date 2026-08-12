"use client";

import { createElement } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteRecognition } from "@/app/admin/actions/recognitions";
import { EmptyState, ListRow } from "@/components/admin/admin-primitives";
import { PinButton, PinnedMark } from "@/components/admin/pin-button";
import { DeleteAction, EditAction } from "@/components/admin/row-actions";
import { getRecognitionIcon } from "@/config/recognition-icons";
import type { Recognition } from "@/db/schema";
import { pinRank } from "@/lib/ordering";
import { useAdminBase } from "@/lib/use-admin-base";

export function AdminRecognitionList({
  recognitions,
  all,
  showing,
}: {
  recognitions: Recognition[];
  all: Recognition[];
  showing: "live" | "draft";
}) {
  const base = useAdminBase();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!recognitions.length) {
    return (
      <EmptyState
        title={showing === "live" ? "Nothing on the site yet" : "No drafts"}
        description={
          showing === "live"
            ? "Recognitions you add will appear here."
            : "Anything saved without adding will appear here."
        }
      />
    );
  }

  function remove(recognition: Recognition) {
    startTransition(async () => {
      const result = await deleteRecognition(recognition.id);
      toast[result.ok ? "success" : "error"](
        result.ok ? "Recognition deleted." : result.message,
      );
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="border-t border-border/60">
      {recognitions.map((recognition) => {
        const rank = pinRank(all, recognition);
        const icon = getRecognitionIcon(recognition.iconName);

        return (
          <ListRow
            key={recognition.id}
            // The mark itself, not its name: it is what tells a first from a
            // third at a glance.
            icon={
              icon
                ? createElement(icon, {
                    className: "size-4",
                    "aria-hidden": true,
                  })
                : null
            }
            title={recognition.title}
            titleMeta={rank ? <PinnedMark rank={rank} /> : null}
            actions={
              <>
                {recognition.published ? (
                  <PinButton
                    kind="recognition"
                    id={recognition.id}
                    pinned={Boolean(recognition.pinnedAt)}
                  />
                ) : null}
                <EditAction
                  href={`${base}/recognitions/${recognition.id}/edit`}
                  what={recognition.title}
                />
                <DeleteAction
                  what={recognition.title}
                  title="Delete this recognition?"
                  description={`“${recognition.title}” will be removed from the site.`}
                  confirmLabel="Delete recognition"
                  pending={pending}
                  onConfirm={() => remove(recognition)}
                />
              </>
            }
          />
        );
      })}
    </div>
  );
}
