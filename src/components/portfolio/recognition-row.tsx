"use client";

import { createElement, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import {
  RecognitionDialog,
  type RecognitionDialogImage,
} from "@/components/portfolio/recognition-dialog";
import {
  getRecognitionIcon,
  type RecognitionIconName,
} from "@/config/recognition-icons";

type RecognitionRowProps = {
  title: string;
  iconName: RecognitionIconName;
  verificationUrl: string | null;
  articleSlug?: string | null;
  images?: RecognitionDialogImage[];
};

const rowClassName =
  "group flex min-h-11 w-full items-start gap-3 py-3 text-left text-foreground/90 transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none";

/**
 * The single place a recognition goes when it has no images to show.
 *
 * Order matters only when both are set: the article is this site's own writing
 * and says more than the outward link does. A recognition carrying only a link
 * therefore behaves exactly as it did before the modal existed.
 */
function soleDestination({
  articleSlug,
  verificationUrl,
}: {
  articleSlug: string | null;
  verificationUrl: string | null;
}) {
  if (articleSlug) {
    return { href: `/writing/${articleSlug}`, external: false } as const;
  }
  if (verificationUrl) {
    return { href: verificationUrl, external: true } as const;
  }
  return null;
}

export function RecognitionRow({
  title,
  iconName,
  verificationUrl,
  articleSlug = null,
  images = [],
}: RecognitionRowProps) {
  const [open, setOpen] = useState(false);

  // A modal is only worth opening for something a link cannot carry, which here
  // means the images. With none, interrupting the visitor with a panel that
  // holds a single button would be a step for its own sake — the row goes
  // straight where that button would have gone.
  const hasImages = images.length > 0;
  const destination = soleDestination({ articleSlug, verificationUrl });
  const interactive = hasImages || destination !== null;

  const content = (
    <>
      {/* Deliberately larger than the 14px title beside it: the icon is what
          identifies the recognition at a glance, so it leads and the text
          reads as its caption. No top offset — a 24px mark and a 24px line
          box already share a baseline. */}
      {createElement(getRecognitionIcon(iconName), {
        className: "size-6 shrink-0 text-foreground",
        "aria-hidden": true,
      })}
      <span className="min-w-0 flex-1 text-sm leading-6">{title}</span>
      {interactive ? (
        <ArrowUpRight
          className="mt-1 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
          aria-hidden="true"
        />
      ) : null}
    </>
  );

  if (!interactive) {
    return (
      <div className="flex min-h-11 w-full items-start gap-3 py-3 text-left text-foreground/90">
        {content}
      </div>
    );
  }

  if (!hasImages && destination) {
    return destination.external ? (
      <a
        href={destination.href}
        target="_blank"
        rel="noreferrer"
        data-bippy-reaction="curious"
        data-bippy-safe-zone
        className={rowClassName}
      >
        {content}
      </a>
    ) : (
      <Link
        href={destination.href}
        data-bippy-reaction="curious"
        data-bippy-safe-zone
        className={rowClassName}
      >
        {content}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-bippy-reaction="curious"
        data-bippy-safe-zone
        className={rowClassName}
      >
        {content}
      </button>
      <RecognitionDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        images={images}
        articleSlug={articleSlug}
        verificationUrl={verificationUrl}
      />
    </>
  );
}
