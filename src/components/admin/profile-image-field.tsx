"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { Area, Point } from "react-easy-crop";
import { ImagePlus, LoaderCircle, Trash2, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cropProfileImage } from "@/lib/image/crop";
import { cleanupUpload } from "@/lib/storage/cleanup-upload";
import { uploadFile } from "@/lib/storage/client";
import { cn } from "@/lib/utils";

const Cropper = dynamic(() => import("react-easy-crop"), { ssr: false });
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
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area>();
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
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedArea(undefined);
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

  async function saveCrop() {
    if (!sourceUrl || !croppedArea) return;
    setPending(true);
    setLocalError(undefined);

    try {
      const file = await cropProfileImage(sourceUrl, croppedArea);
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
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="size-20 rounded-lg border">
            {currentImage ? (
              <AvatarImage
                src={currentImage}
                alt="Current profile image"
                className="rounded-lg object-cover"
              />
            ) : null}
            <AvatarFallback className="rounded-lg">
              <UserRound aria-hidden="true" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-wrap gap-2">
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

      <Dialog
        open={Boolean(sourceUrl)}
        onOpenChange={(open) => !open && closeCropper()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crop profile image</DialogTitle>
            <DialogDescription>
              Move and zoom the image inside the square frame.
            </DialogDescription>
          </DialogHeader>
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
            {sourceUrl ? (
              <Cropper
                image={sourceUrl}
                crop={crop}
                zoom={zoom}
                rotation={0}
                aspect={1}
                minZoom={1}
                maxZoom={3}
                zoomSpeed={1}
                cropShape="rect"
                showGrid={false}
                style={{}}
                classes={{}}
                restrictPosition
                mediaProps={{}}
                cropperProps={{}}
                keyboardStep={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_area, pixels) => setCroppedArea(pixels)}
              />
            ) : null}
          </div>
          <Field>
            <FieldLabel htmlFor="profile-image-zoom">Zoom</FieldLabel>
            <Slider
              id="profile-image-zoom"
              thumbLabel="Profile image zoom"
              min={1}
              max={3}
              step={0.01}
              value={[zoom]}
              onValueChange={(values) => setZoom(values[0] ?? 1)}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeCropper}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending || !croppedArea}
              onClick={() => void saveCrop()}
            >
              {pending ? (
                <LoaderCircle
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : null}
              Use image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
