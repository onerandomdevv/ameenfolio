"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Area } from "react-easy-crop";
import { LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { saveNowLink } from "@/app/admin/actions/now";
import { ImageCropDialog } from "@/components/admin/image-crop-dialog";
import { LineInput } from "@/components/admin/line-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DEFAULT_NOW_LINK_ICON,
  getNowLinkIcon,
  nowLinkIconOptions,
  type NowLinkIconName,
} from "@/config/now-link-icons";
import type { NowLink } from "@/db/schema";
import { cropIconImage } from "@/lib/image/crop";
import { uploadFile } from "@/lib/storage/client";
import { cn } from "@/lib/utils";

const mediaBase = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.replace(
  /\/$/,
  "",
);

function iconSrc(key: string) {
  return mediaBase ? `${mediaBase}/${key}` : `/media/${key}`;
}

/**
 * Add and edit are the same dialog: a link is three facts — a picture, a name
 * and an address — and both jobs set all three. Splitting them would mean two
 * layouts to keep in step for no difference the eye can see.
 */
export function NowLinkDialog({
  link,
  open,
  onOpenChange,
  displayOrder,
}: {
  link?: NowLink;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displayOrder?: number;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [label, setLabel] = useState(link?.label ?? "");
  const [url, setUrl] = useState(link?.url ?? "https://");
  const [iconKey, setIconKey] = useState<string | undefined>(
    link?.iconKey ?? undefined,
  );
  const [iconName, setIconName] = useState<NowLinkIconName>(
    (link?.iconName as NowLinkIconName) ?? DEFAULT_NOW_LINK_ICON,
  );
  const [sourceUrl, setSourceUrl] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [saving, startSaving] = useTransition();

  // Every open starts from the saved values, so Cancel really does discard.
  // Keyed on the closed-to-open transition rather than on the link's id: a row
  // owns one dialog for its whole life, so the id never changes and a test
  // against it can never fire — including for the add dialog, where the id is
  // undefined on both sides.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setLabel(link?.label ?? "");
      setUrl(link?.url ?? "https://");
      setIconKey(link?.iconKey ?? undefined);
      setIconName((link?.iconName as NowLinkIconName) ?? DEFAULT_NOW_LINK_ICON);
    }
  }

  function chooseFile(file: File) {
    setSourceUrl(URL.createObjectURL(file));
    if (fileRef.current) fileRef.current.value = "";
  }

  function closeCropper() {
    setSourceUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return undefined;
    });
  }

  async function upload(area: Area) {
    if (!sourceUrl) return;
    setUploading(true);
    try {
      const file = await cropIconImage(sourceUrl, area);
      const { key } = await uploadFile("icon", file);
      setIconKey(key);
      closeCropper();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function save() {
    startSaving(async () => {
      const result = await saveNowLink(
        {
          label,
          url,
          iconKey,
          iconName,
          // The label already names the thing, so asking for alt text as well
          // would be asking for the same fact twice.
          iconAlt: iconKey ? label || "Link icon" : undefined,
          displayOrder: link?.displayOrder ?? displayOrder ?? 0,
          visible: true,
        },
        link?.id,
      );
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(link ? "Link updated." : "Link added.");
      onOpenChange(false);
      router.refresh();
    });
  }

  const SelectedIcon = getNowLinkIcon(iconName);
  const valid = label.trim().length > 0 && url.startsWith("https://");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="admin-theme gap-5 p-4 sm:max-w-[420px] sm:p-5">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-medium">
              {link ? "Edit link" : "Add link"}
            </DialogTitle>
          </DialogHeader>

          {/* The picture is the first decision, so it leads: what the link will
              look like on the left, and the way to change it on the right. */}
          <div className="flex items-center gap-3">
            <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-accent">
              {uploading ? (
                <LoaderCircle
                  className="size-4 animate-spin text-muted-foreground"
                  aria-hidden="true"
                />
              ) : iconKey ? (
                <Image
                  src={iconSrc(iconKey)}
                  alt=""
                  width={56}
                  height={56}
                  unoptimized
                  className="size-full object-cover"
                />
              ) : (
                <SelectedIcon className="size-5 text-foreground" />
              )}
            </span>

            <div className="flex min-w-0 flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {iconKey ? "Replace" : "Upload image"}
              </Button>
              {iconKey ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIconKey(undefined)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 aria-hidden="true" />
                  Remove
                </Button>
              ) : null}
            </div>
          </div>

          {/* Only meaningful without an image, so it appears then — an uploaded
              picture already answers the question these buttons ask. */}
          {iconKey ? null : (
            <div>
              <p className="mb-2 font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
                Or pick a mark
              </p>
              <div className="flex flex-wrap gap-1.5">
                {nowLinkIconOptions.map((option) => {
                  const Icon = option.icon;
                  const active = option.value === iconName;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={active}
                      aria-label={option.label}
                      title={option.label}
                      onClick={() => setIconName(option.value)}
                      className={cn(
                        "grid size-9 place-items-center rounded-md border transition-colors",
                        active
                          ? "border-foreground/30 bg-accent text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <FieldLine label="Name">
              <LineInput
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="What it is called"
              />
            </FieldLine>
            <FieldLine label="Link">
              <LineInput
                mono
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://"
              />
            </FieldLine>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="max-sm:w-full"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!valid || saving || uploading}
              onClick={save}
              className="max-sm:w-full"
            >
              {saving ? (
                <LoaderCircle
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : null}
              {link ? "Save link" : "Add link"}
            </Button>
          </DialogFooter>

          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            style={{ width: 1, height: 1 }}
            tabIndex={-1}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) chooseFile(file);
            }}
          />
        </DialogContent>
      </Dialog>

      <ImageCropDialog
        sourceUrl={sourceUrl}
        title="Crop icon"
        confirmLabel="Use icon"
        pending={uploading}
        onCancel={closeCropper}
        onConfirm={(area) => void upload(area)}
      />
    </>
  );
}

// The same label-and-rule shape the rest of the admin uses for a field, kept
// local because inside a dialog the label column is narrower.
function FieldLine({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-3 border-b border-border/60 py-2.5">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <div className="min-w-0 text-[13px]">{children}</div>
    </div>
  );
}
