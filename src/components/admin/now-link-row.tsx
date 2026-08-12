"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Globe, LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteNowLink, saveNowLink } from "@/app/admin/actions/now";
import { LineInput } from "@/components/admin/line-input";
import { Button } from "@/components/ui/button";
import type { NowLink } from "@/db/schema";
import { uploadFile } from "@/lib/storage/client";

const mediaBase = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.replace(
  /\/$/,
  "",
);

function iconSrc(key: string) {
  return mediaBase ? `${mediaBase}/${key}` : `/media/${key}`;
}

// An icon is optional. Until one is uploaded the row shows a web mark, so the
// list never has a hole in it where a picture might go.
export function NowLinkRow({
  link,
  onDone,
}: {
  link?: NowLink;
  onDone?: () => void;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [label, setLabel] = useState(link?.label ?? "");
  const [url, setUrl] = useState(link?.url ?? "https://");
  const [iconKey, setIconKey] = useState(link?.iconKey ?? undefined);
  const [uploading, setUploading] = useState(false);
  const [busy, startTransition] = useTransition();

  const dirty =
    label !== (link?.label ?? "") ||
    url !== (link?.url ?? "https://") ||
    iconKey !== (link?.iconKey ?? undefined);

  function save() {
    startTransition(async () => {
      const result = await saveNowLink(
        {
          label,
          url,
          iconKey,
          // Alt text is required whenever an icon is set, and the label already
          // names the thing — asking twice would be asking for the same fact.
          iconAlt: iconKey ? label || "Link icon" : undefined,
          displayOrder: link?.displayOrder ?? 0,
          visible: true,
        },
        link?.id,
      );
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(link ? "Link updated." : "Link added.");
      onDone?.();
      router.refresh();
    });
  }

  function remove() {
    if (!link) {
      onDone?.();
      return;
    }
    startTransition(async () => {
      const result = await deleteNowLink(link.id);
      toast[result.ok ? "success" : "error"](
        result.ok ? "Link removed." : result.message,
      );
      if (result.ok) router.refresh();
    });
  }

  async function upload(file: File) {
    setUploading(true);
    try {
      const { key } = await uploadFile("icon", file);
      setIconKey(key);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border/60 py-2.5">
      <span className="grid size-[26px] shrink-0 place-items-center overflow-hidden rounded-md bg-accent">
        {uploading ? (
          <LoaderCircle
            className="size-3.5 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        ) : iconKey ? (
          <Image
            src={iconSrc(iconKey)}
            alt=""
            width={26}
            height={26}
            unoptimized
            className="size-full object-cover"
          />
        ) : (
          <Globe
            className="size-3.5 text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </span>

      <span className="w-[7.5rem] shrink-0">
        <LineInput
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Name"
        />
      </span>
      <span className="min-w-0 flex-1 basis-[11rem]">
        <LineInput
          mono
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://"
        />
      </span>

      <span className="ml-auto flex shrink-0 items-center gap-1">
        {dirty ? (
          <Button size="sm" onClick={save} disabled={busy}>
            Save
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {iconKey ? "Replace icon" : "Upload icon"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={remove}
          disabled={busy}
          aria-label={link ? `Remove ${link.label}` : "Discard this link"}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </span>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
    </div>
  );
}
