"use client";

import { useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Newspaper,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RECOGNITION_IMAGE_SIZE } from "@/lib/image/crop";
import { recognitionImageAlt } from "@/lib/recognition";
import { cn } from "@/lib/utils";

export type RecognitionDialogImage = {
  objectKey: string;
  /** Set only when this image was described individually. */
  alt: string | null;
};

type RecognitionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  images: RecognitionDialogImage[];
  articleSlug: string | null;
  verificationUrl: string | null;
};

export function RecognitionDialog({
  open,
  onOpenChange,
  title,
  images,
  articleSlug,
  verificationUrl,
}: RecognitionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-left text-base leading-6">
            {title}
          </DialogTitle>
        </DialogHeader>

        {images.length ? <Carousel images={images} title={title} /> : null}

        <RecognitionActions
          articleSlug={articleSlug}
          verificationUrl={verificationUrl}
          onNavigate={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * A scroll-snap strip rather than a carousel library.
 *
 * Swiping, momentum, and keyboard scrolling are what the browser already does
 * with an overflow container; a library would reimplement them in JavaScript to
 * arrive at the same place. The arrows below drive it with scrollTo, so the
 * scroll position stays the single source of truth and nothing can disagree
 * with what is on screen.
 */
function Carousel({
  images,
  title,
}: {
  images: RecognitionDialogImage[];
  title: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const single = images.length === 1;

  function scrollToIndex(next: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.min(images.length - 1, Math.max(0, next));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
  }

  // Derived from the scroll offset rather than tracked separately, so a swipe
  // and an arrow press cannot leave the dots describing a different image than
  // the one being shown.
  function syncIndex() {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  return (
    <div className="grid gap-3">
      <div className="relative">
        <ul
          ref={trackRef}
          onScroll={syncIndex}
          // tabIndex so the strip is reachable by keyboard: an overflow
          // container scrolls with arrow keys only once it can hold focus.
          tabIndex={single ? undefined : 0}
          aria-label={single ? undefined : `${images.length} images`}
          className={cn(
            "flex snap-x snap-mandatory overflow-x-auto rounded-lg",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          )}
        >
          {images.map((image, index) => (
            <li key={image.objectKey} className="w-full shrink-0 snap-center">
              {/* Every image is stored square at a known size, so the frame is
                  reserved before anything loads and the dialog never jumps. */}
              <Image
                src={`/media/${image.objectKey}`}
                alt={recognitionImageAlt({
                  alt: image.alt,
                  title,
                  index,
                  total: images.length,
                })}
                width={RECOGNITION_IMAGE_SIZE}
                height={RECOGNITION_IMAGE_SIZE}
                sizes="(min-width: 640px) 28rem, 100vw"
                className="aspect-square w-full bg-muted object-cover"
              />
            </li>
          ))}
        </ul>

        {single ? null : (
          <>
            <CarouselArrow
              side="left"
              label="Previous image"
              disabled={index === 0}
              onClick={() => scrollToIndex(index - 1)}
            />
            <CarouselArrow
              side="right"
              label="Next image"
              disabled={index === images.length - 1}
              onClick={() => scrollToIndex(index + 1)}
            />
          </>
        )}
      </div>

      {single ? null : (
        <ul className="flex justify-center gap-1.5" aria-hidden="true">
          {images.map((image, dotIndex) => (
            <li
              key={image.objectKey}
              className={cn(
                "size-1.5 rounded-full transition-colors",
                dotIndex === index ? "bg-foreground" : "bg-border",
              )}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CarouselArrow({
  side,
  label,
  disabled,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "absolute top-1/2 flex size-8 -translate-y-1/2 items-center justify-center",
        "rounded-full bg-background/80 text-foreground backdrop-blur",
        "transition-opacity hover:bg-background disabled:pointer-events-none disabled:opacity-0",
        side === "left" ? "left-2" : "right-2",
      )}
    >
      {side === "left" ? (
        <ChevronLeft className="size-4" aria-hidden="true" />
      ) : (
        <ChevronRight className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}

/**
 * Only the buttons that lead somewhere are rendered.
 *
 * The same reasoning as the contact dialog's channel list: this exists to offer
 * a choice, and a greyed-out control is not one. A disabled button also cannot
 * take focus, so it explains itself to nobody using a keyboard or a screen
 * reader — it is simply a dead patch of the interface.
 */
function RecognitionActions({
  articleSlug,
  verificationUrl,
  onNavigate,
}: {
  articleSlug: string | null;
  verificationUrl: string | null;
  onNavigate: () => void;
}) {
  const actions = [
    articleSlug
      ? {
          key: "article",
          label: "Read Post",
          href: `/writing/${articleSlug}`,
          icon: Newspaper,
          external: false,
        }
      : null,
    verificationUrl
      ? {
          key: "post",
          // The recognition has one outward link — the post announcing it, or
          // the certificate proving it. Named for the commoner case.
          label: "View Post",
          href: verificationUrl,
          icon: ArrowUpRight,
          external: true,
        }
      : null,
  ].filter((action) => action !== null);

  if (!actions.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        const className =
          "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm text-foreground transition-colors hover:bg-accent focus-visible:bg-accent";

        return action.external ? (
          <a
            key={action.key}
            href={action.href}
            target="_blank"
            rel="noreferrer"
            onClick={onNavigate}
            className={className}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {action.label}
          </a>
        ) : (
          <Link
            key={action.key}
            href={action.href}
            onClick={onNavigate}
            className={className}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {action.label}
          </Link>
        );
      })}
    </div>
  );
}
