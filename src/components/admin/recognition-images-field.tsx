"use client";

import { useEffect, useRef, useState } from "react";
import type { Area } from "react-easy-crop";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import { ImageCropDialog } from "@/components/admin/image-crop-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cropIsUpscaled, cropRecognitionImage } from "@/lib/image/crop";
import { cleanupUpload } from "@/lib/storage/cleanup-upload";
import { uploadFile } from "@/lib/storage/client";
import { MAX_RECOGNITION_IMAGES } from "@/lib/validation";
import { cn } from "@/lib/utils";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

export type RecognitionImageValue = {
  objectKey: string;
  // Carried through rather than edited: the form does not ask for one, but a
  // description already stored is preserved and still wins over derived alt.
  alt?: string;
  displayOrder: number;
};

type RecognitionImagesFieldProps = {
  value: RecognitionImageValue[];
  initialKeys: string[];
  onChange: (images: RecognitionImageValue[]) => void;
  error?: string;
  className?: string;
};

export function RecognitionImagesField({
  value,
  initialKeys,
  onChange,
  error,
  className,
}: RecognitionImagesFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sourceUrl, setSourceUrl] = useState<string>();
  const [queue, setQueue] = useState<File[]>([]);
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  // Object URLs for images uploaded in this session, keyed by object key.
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const full = value.length >= MAX_RECOGNITION_IMAGES;

  useEffect(
    () => () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    },
    [sourceUrl],
  );

  // Revoked together on unmount rather than as each is replaced: a thumbnail
  // may still be painting from one when its row moves, and a URL revoked out
  // from under a live <img> blanks it.
  //
  // The ref keeps the cleanup out of the dependency list — depending on
  // `previews` would run this on every upload and revoke the one just added.
  const previewsRef = useRef(previews);
  previewsRef.current = previews;
  useEffect(
    () => () => {
      Object.values(previewsRef.current).forEach(URL.revokeObjectURL);
    },
    [],
  );

  // Selecting several files opens the cropper once per file: each image needs
  // its own framing decision, so they are queued rather than cropped for the
  // owner. The queue is the source of truth and `sourceUrl` follows its head.
  function advanceQueue(remaining: File[]) {
    // The effect above owns revoking the previous source URL — doing it here
    // too would be a second owner for one resource.
    const next = remaining[0];
    setQueue(remaining);
    setSourceUrl(next ? URL.createObjectURL(next) : undefined);
    // Cleared once the whole batch is done, so choosing the same files again
    // still fires a change event.
    if (!next && inputRef.current) inputRef.current.value = "";
  }

  function closeCropper() {
    // Cancelling drops the rest of the batch: having said no to this image,
    // being handed the next four unasked is not what cancel means.
    advanceQueue([]);
  }

  function selectFiles(fileList: FileList) {
    setLocalError(undefined);
    setNotice(undefined);
    const chosen = [...fileList];

    const usable = chosen.filter(
      (file) => ALLOWED_TYPES.has(file.type) && file.size <= MAX_SOURCE_BYTES,
    );
    if (usable.length < chosen.length) {
      setLocalError(
        `${chosen.length - usable.length} file${
          chosen.length - usable.length === 1 ? " was" : "s were"
        } skipped — use PNG, JPEG, or WebP up to 10 MB.`,
      );
    }

    // Trimmed to what will fit rather than refused wholesale, so selecting ten
    // with two slots left keeps the first two instead of nothing.
    const room = MAX_RECOGNITION_IMAGES - value.length;
    const accepted = usable.slice(0, room);
    if (usable.length > room) {
      setNotice(
        `Only ${room} more image${room === 1 ? "" : "s"} will fit, so the rest were skipped.`,
      );
    }

    if (accepted.length) advanceQueue(accepted);
  }

  // Renumbered on every change rather than stored as chosen, so the order is
  // always 0..n-1 with no gaps whatever was added, moved, or removed.
  function commit(images: RecognitionImageValue[]) {
    onChange(images.map((image, index) => ({ ...image, displayOrder: index })));
  }

  async function saveCrop(area: Area) {
    if (!sourceUrl) return;
    setPending(true);
    setLocalError(undefined);

    try {
      const file = await cropRecognitionImage(sourceUrl, area);
      const uploaded = await uploadFile("recognition", file);
      // /media only serves objects a published row already references, so an
      // image that has just been uploaded — and not yet saved, let alone
      // published — necessarily 404s there. The local blob is the only thing
      // that can show it until then.
      setPreviews((current) => ({
        ...current,
        [uploaded.key]: URL.createObjectURL(file),
      }));
      commit([...value, { objectKey: uploaded.key, displayOrder: 0 }]);
      // Reported, never blocking: an undersized source is still the image the
      // owner has, and refusing it would leave the recognition with none.
      if (cropIsUpscaled(area)) {
        setNotice(
          "That crop was smaller than 1080px, so it was scaled up and may look soft.",
        );
      }
      // On to the next file in the batch, or closed if that was the last.
      advanceQueue(queue.slice(1));
    } catch (uploadError) {
      setLocalError(
        uploadError instanceof Error
          ? uploadError.message
          : "The image could not be uploaded.",
      );
    } finally {
      setPending(false);
    }
  }

  async function removeImage(objectKey: string) {
    commit(value.filter((image) => image.objectKey !== objectKey));
    // Only objects this session uploaded are cleaned up. Deleting one that was
    // already saved would strand the recognition's live image if the form is
    // then abandoned rather than saved.
    if (!initialKeys.includes(objectKey)) await cleanupUpload(objectKey);
  }

  function move(index: number, by: number) {
    const next = [...value];
    const target = index + by;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  }

  return (
    <>
      <Field className={cn(className)} data-invalid={Boolean(error)}>
        <FieldLabel htmlFor="recognition-image-upload">
          Images
          <span className="ml-2 font-normal text-muted-foreground">
            {value.length}/{MAX_RECOGNITION_IMAGES} · square, 1080px
          </span>
        </FieldLabel>

        {value.length ? (
          <ul className="grid gap-2">
            {value.map((image, index) => (
              <li
                key={image.objectKey}
                className="flex items-start gap-3 rounded-md border border-border p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element --
                    an admin thumbnail of an already-optimised 1080 webp; the
                    optimiser would add a round trip for no gain here. */}
                <img
                  src={previews[image.objectKey] ?? `/media/${image.objectKey}`}
                  alt=""
                  className="size-16 shrink-0 rounded object-cover"
                />
                {/* No description field: what a screen reader announces is
                    derived from the recognition's title and this image's
                    position — see recognitionImageAlt. */}
                <span className="min-w-0 flex-1 self-center font-mono text-[11px] text-muted-foreground">
                  Image {index + 1}
                </span>
                <div className="flex shrink-0 gap-1">
                  {/* Up/down rather than dragging: no drag library is installed,
                      and buttons are also the only version of this that works
                      from a keyboard. */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Move image ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Move image ${index + 1} down`}
                    disabled={index === value.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove image ${index + 1}`}
                    onClick={() => void removeImage(image.objectKey)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        <div>
          <Button
            type="button"
            variant="outline"
            disabled={pending || full}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus data-icon="inline-start" />
            Add image
          </Button>
        </div>

        <Input
          ref={inputRef}
          id="recognition-image-upload"
          className="sr-only"
          // Inline, for the same reason as the profile field: the Input base
          // sets w-full and tailwind-merge resolves that against sr-only
          // unpredictably, leaving an invisible full-width element that still
          // widens the page on a phone.
          style={{ width: 1, height: 1 }}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          disabled={pending || full}
          onChange={(event) => {
            const files = event.target.files;
            if (files?.length) selectFiles(files);
          }}
        />

        {notice ? (
          <p className="text-xs text-muted-foreground">{notice}</p>
        ) : null}
        <FieldError>{error ?? localError}</FieldError>
      </Field>

      <ImageCropDialog
        sourceUrl={sourceUrl}
        // Says where you are in a batch, so cropping five images does not feel
        // like the same dialog reopening for no reason.
        title={
          queue.length > 1
            ? `Crop image ${value.length + 1} of ${value.length + queue.length}`
            : "Crop to 1080 × 1080"
        }
        confirmLabel={queue.length > 1 ? "Add and continue" : "Add image"}
        pending={pending}
        onCancel={closeCropper}
        onConfirm={(area) => void saveCrop(area)}
      />
    </>
  );
}
