"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Area, Point } from "react-easy-crop";
import { LoaderCircle, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

const Cropper = dynamic(() => import("react-easy-crop"), { ssr: false });

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const STEP = 0.25;

/**
 * One crop dialog for every square image the admin takes — the profile photo
 * and Now link icons today.
 *
 * The picture is the whole interface: no description paragraph, no field label
 * over the slider, and the two buttons sit under it. On a phone the frame is
 * the width of the screen and the buttons go full width, because a crop is a
 * two-handed gesture and the controls should not compete with it.
 */
export function ImageCropDialog({
  sourceUrl,
  title,
  confirmLabel = "Use image",
  pending,
  onCancel,
  onConfirm,
}: {
  sourceUrl?: string;
  title: string;
  confirmLabel?: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: (area: Area) => void;
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [area, setArea] = useState<Area>();

  // A second image would otherwise open where the first one was left: same
  // dialog, new picture, stale pan and zoom. Adjusted during render rather than
  // in an effect, which would paint the old framing for one frame first.
  const [seen, setSeen] = useState(sourceUrl);
  if (seen !== sourceUrl) {
    setSeen(sourceUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(MIN_ZOOM);
    setArea(undefined);
  }

  const nudgeZoom = (by: number) =>
    setZoom((current) =>
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((current + by).toFixed(2)))),
    );

  return (
    <Dialog
      open={Boolean(sourceUrl)}
      onOpenChange={(open) => !open && onCancel()}
    >
      <DialogContent
        showCloseButton={false}
        className="admin-theme gap-4 p-4 sm:max-w-[360px] sm:p-5"
      >
        <DialogHeader>
          <DialogTitle className="text-[15px] font-medium">{title}</DialogTitle>
        </DialogHeader>

        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black/40">
          {sourceUrl ? (
            <Cropper
              image={sourceUrl}
              crop={crop}
              zoom={zoom}
              rotation={0}
              aspect={1}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
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
              onCropComplete={(_area, pixels) => setArea(pixels)}
            />
          ) : null}
        </div>

        {/* Buttons either side of the slider so zoom is reachable with one
            thumb, where dragging the picture needs a deliberate two-finger
            pinch. */}
        <div className="flex items-center gap-3">
          <ZoomButton label="Zoom out" onClick={() => nudgeZoom(-STEP)}>
            <Minus aria-hidden="true" />
          </ZoomButton>
          <Slider
            aria-label="Zoom"
            thumbLabel="Zoom"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={[zoom]}
            onValueChange={(values) => setZoom(values[0] ?? MIN_ZOOM)}
          />
          <ZoomButton label="Zoom in" onClick={() => nudgeZoom(STEP)}>
            <Plus aria-hidden="true" />
          </ZoomButton>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {/* Outlined, not ghost: full width on a phone a ghost button reads as
              a stray link under the primary one. */}
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="max-sm:w-full"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={pending || !area}
            onClick={() => area && onConfirm(area)}
            className="max-sm:w-full"
          >
            {pending ? (
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
            ) : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ZoomButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      onClick={onClick}
      className="shrink-0 text-muted-foreground hover:text-foreground"
    >
      {children}
    </Button>
  );
}
