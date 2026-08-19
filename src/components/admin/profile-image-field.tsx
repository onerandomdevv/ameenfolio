"use client";

import { useEffect, useRef, useState } from "react";
import type { Area } from "react-easy-crop";
import { ImagePlus, Trash2, UserRound } from "lucide-react";
import { ImageCropDialog } from "@/components/admin/image-crop-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cropProfileImage } from "@/lib/image/crop";
import { cleanupUpload } from "@/lib/storage/cleanup-upload";
import { uploadFile } from "@/lib/storage/client";
import { cn } from "@/lib/utils";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

type ProfileImageFieldProps = {
  value?: string;
  initialValue?: string;
  onChange: (key?: string) => void;
  error?: string;
  className?: string;
};

export function ProfileImageField({
  value,
  initialValue,
  onChange,
  error,
  className,
}: ProfileImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sourceUrl, setSourceUrl] = useState<string>();
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string>();
  const invalid = Boolean(error || localError);

  useEffect(
    () => () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    },
    [sourceUrl],
  );

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  function closeCropper() {
    setSourceUrl(undefined);
    if (inputRef.current) inputRef.current.value = "";
  }

  function selectFile(file: File) {
    setLocalError(undefined);
    if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_SOURCE_BYTES) {
      setLocalError("Choose a PNG, JPEG, or WebP image up to 10 MB.");
      return;
    }
    setSourceUrl(URL.createObjectURL(file));
  }

  async function saveCrop(area: Area) {
    if (!sourceUrl) return;
    setPending(true);
    setLocalError(undefined);

    try {
      const file = await cropProfileImage(sourceUrl, area);
      const uploaded = await uploadFile("profile", file);
      if (value && value !== initialValue) await cleanupUpload(value);
      setPreviewUrl(URL.createObjectURL(file));
      onChange(uploaded.key);
      closeCropper();
    } catch (uploadError) {
      setLocalError(
        uploadError instanceof Error
          ? uploadError.message
          : "Profile image upload failed.",
      );
    } finally {
      setPending(false);
    }
  }

  async function removeImage() {
    if (value && value !== initialValue) await cleanupUpload(value);
    onChange(undefined);
    setPreviewUrl(undefined);
  }

  const currentImage = previewUrl ?? (value ? `/media/${value}` : undefined);

  return (
    <>
      <Field
        className={cn(className)}
        data-invalid={invalid}
        data-disabled={pending}
      >
        <FieldLabel htmlFor="profile-image-upload">Profile image</FieldLabel>
        {/* Below sm the buttons sit beside the image and split its height, one
            at the top edge and one at the bottom, so the pair reads as one
            block. From sm up the field is inside a 150px column, which is too
            narrow for that, so they stack under the image instead. */}
        <div className="flex items-stretch gap-3 sm:flex-col sm:items-start">
          <Avatar className="size-20 shrink-0 rounded-md border">
            {currentImage ? (
              <AvatarImage
                src={currentImage}
                alt="Current profile image"
                className="rounded-md object-cover"
              />
            ) : null}
            <AvatarFallback className="rounded-md">
              <UserRound aria-hidden="true" />
            </AvatarFallback>
          </Avatar>
          <div
            className={cn(
              "flex min-w-0 flex-1 flex-col gap-2 sm:flex-none sm:flex-row sm:flex-wrap",
              // With only one button there is no pair to space apart, so it
              // centres on the image rather than clinging to its top edge.
              value ? "justify-between" : "justify-center sm:justify-start",
            )}
          >
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus data-icon="inline-start" />
              Choose image
            </Button>
            {value ? (
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => void removeImage()}
              >
                <Trash2 data-icon="inline-start" />
                Remove
              </Button>
            ) : null}
          </div>
        </div>
        <Input
          ref={inputRef}
          id="profile-image-upload"
          className="sr-only"
          // Inline, because the Input base sets w-full and tailwind-merge
          // resolves that against sr-only unpredictably — leaving an invisible
          // full-width element that still widened the page on a phone. A style
          // attribute cannot be merged away.
          style={{ width: 1, height: 1 }}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={pending}
          aria-invalid={invalid}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) selectFile(file);
          }}
        />
        <FieldError>{error ?? localError}</FieldError>
      </Field>

      <ImageCropDialog
        sourceUrl={sourceUrl}
        title="Crop profile image"
        pending={pending}
        onCancel={closeCropper}
        onConfirm={(area) => void saveCrop(area)}
      />
    </>
  );
}
