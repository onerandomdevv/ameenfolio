"use client";

import { createElement, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { deleteNowLink } from "@/app/admin/actions/now";
import { NowLinkDialog } from "@/components/admin/now-link-dialog";
import { DeleteAction } from "@/components/admin/row-actions";
import { Button } from "@/components/ui/button";
import { getNowLinkIcon } from "@/config/now-link-icons";
import type { NowLink } from "@/db/schema";

const mediaBase = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.replace(
  /\/$/,
  "",
);

function iconSrc(key: string) {
  return mediaBase ? `${mediaBase}/${key}` : `/media/${key}`;
}

// A row is now a summary, not a form: the name, where it goes, and the mark it
// shows. Editing happens in the dialog, so a phone-width row no longer has to
// hold two inputs side by side.
export function NowLinkRow({ link }: { link: NowLink }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteNowLink(link.id);
      toast[result.ok ? "success" : "error"](
        result.ok ? "Link removed." : result.message,
      );
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3 border-b border-border/60 py-2.5">
      <span className="grid size-[26px] shrink-0 place-items-center overflow-hidden rounded-md bg-accent">
        {link.iconKey ? (
          <Image
            src={iconSrc(link.iconKey)}
            alt=""
            width={26}
            height={26}
            unoptimized
            className="size-full object-cover"
          />
        ) : (
          // createElement rather than <Icon />: a capitalised render-scoped
          // variable trips react-hooks/static-components, which cannot tell a
          // registry lookup from a component defined inline.
          createElement(getNowLinkIcon(link.iconName), {
            className: "size-3.5 text-foreground",
          })
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium">{link.label}</p>
        <p className="truncate font-mono text-[11px] text-muted-foreground">
          {link.url}
        </p>
      </div>

      <span className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing(true)}
          aria-label={`Edit ${link.label}`}
          title="Edit link"
          className="w-8 px-0 text-muted-foreground hover:text-foreground"
        >
          <Pencil aria-hidden="true" />
        </Button>
        <DeleteAction
          what={link.label}
          title="Delete this link?"
          description={`“${link.label}” will be removed from the Now section.`}
          confirmLabel="Delete link"
          pending={busy}
          onConfirm={remove}
        />
      </span>

      <NowLinkDialog link={link} open={editing} onOpenChange={setEditing} />
    </div>
  );
}
