"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveNowSection } from "@/app/admin/actions/now";
import {
  AdminPage,
  FieldNote,
  SectionHeading,
} from "@/components/admin/admin-primitives";
import { LineInput } from "@/components/admin/line-input";
import { NowLinkDialog } from "@/components/admin/now-link-dialog";
import { NowLinkRow } from "@/components/admin/now-link-row";
import { Button } from "@/components/ui/button";
import type { NowLink, NowSection } from "@/db/schema";
import { MAX_NOW_LINKS } from "@/lib/ordering";

const MAX_DESCRIPTION = 600;

export function NowManager({
  section,
  links,
}: {
  section: NowSection;
  links: NowLink[];
}) {
  const router = useRouter();
  const [description, setDescription] = useState(section.description);
  const [saving, startSaving] = useTransition();
  // A row that exists only in the browser until it is saved, so "Add link"
  // gives you somewhere to type rather than writing an empty row first.
  const [drafting, setDrafting] = useState(false);

  function save() {
    startSaving(async () => {
      const result = await saveNowSection({
        description,
        // Saving is what puts it on the site — there is no separate switch.
        published: true,
      });
      toast[result.ok ? "success" : "error"](
        result.ok ? "Now updated." : result.message,
      );
      if (result.ok) router.refresh();
    });
  }

  const atCap = links.length >= MAX_NOW_LINKS;

  return (
    <AdminPage
      title="Now"
      actions={
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <LoaderCircle data-icon="inline-start" className="animate-spin" />
          ) : null}
          Save changes
        </Button>
      }
    >
      <div className="max-w-[720px]">
        <SectionHeading
          meta={
            <span className="font-mono tabular-nums">
              {description.trim().length} / {MAX_DESCRIPTION}
            </span>
          }
        >
          Current focus
        </SectionHeading>
        <LineInput
          as="textarea"
          rows={5}
          maxLength={MAX_DESCRIPTION}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What you are working on right now"
          className="rounded-lg border border-border bg-card px-3 py-2.5 text-[13.5px] leading-7"
        />
        <FieldNote>Saving puts this on the site straight away.</FieldNote>

        <SectionHeading
          className="mt-8"
          meta={
            <span className="font-mono tabular-nums">
              {links.length} / {MAX_NOW_LINKS}
            </span>
          }
          action={
            !atCap ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDrafting(true)}
              >
                <Plus data-icon="inline-start" />
                Add link
              </Button>
            ) : null
          }
        >
          Links
        </SectionHeading>

        <div className="border-t border-border/60">
          {links.map((link) => (
            <NowLinkRow key={link.id} link={link} />
          ))}
        </div>

        {!links.length ? (
          <FieldNote>
            No links yet. Up to {MAX_NOW_LINKS} can sit under the copy.
          </FieldNote>
        ) : null}

        {/* Adding uses the same dialog as editing, so both routes set the same
            three facts in the same layout. */}
        <NowLinkDialog
          open={drafting}
          onOpenChange={setDrafting}
          displayOrder={links.length}
        />
      </div>
    </AdminPage>
  );
}
