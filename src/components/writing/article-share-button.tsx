"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

type ArticleShareButtonProps = {
  title: string;
};

export function ArticleShareButton({ title }: ArticleShareButtonProps) {
  async function shareArticle() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      toast.success("Article link copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Could not share this article");
    }
  }

  return (
    <button
      type="button"
      onClick={shareArticle}
      aria-label="Share article"
      title="Share article"
      data-bippy-safe-zone
      className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:text-foreground focus-visible:text-foreground"
    >
      <Share2 aria-hidden="true" className="size-4" />
    </button>
  );
}
