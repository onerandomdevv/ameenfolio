"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ResumeDownloadButtonProps = {
  hasResume: boolean;
  filename: string | null;
  // The caller positions it. This used to hard-code the absolute placement it
  // needed beside the old footer separator, which is exactly what made it
  // unusable anywhere else.
  className?: string;
};

export function ResumeDownloadButton({
  hasResume,
  filename,
  className,
}: ResumeDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  async function downloadResume() {
    // Checked before any request so a missing résumé costs nothing and says so,
    // rather than surfacing as a failed fetch that reads like a broken site.
    if (!hasResume) {
      toast.error("No résumé has been uploaded yet.");
      return;
    }
    if (downloading) return;

    setDownloading(true);
    let objectUrl: string | undefined;

    try {
      const response = await fetch("/resume");
      if (!response.ok) throw new Error(`Resume request failed`);

      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename || "resume.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Résumé downloaded.");
    } catch {
      toast.error("The résumé could not be downloaded. Please try again.");
    } finally {
      // Revoking straight after click() can cancel the download while the
      // browser is still reading the blob, so the URL is released a beat later.
      if (objectUrl) {
        const url = objectUrl;
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
      setDownloading(false);
    }
  }

  return (
    // A plain button rather than the Button component: this sits inside a
    // sentence now, and Button's fixed height and padding would break the line
    // it is part of.
    <button
      type="button"
      onClick={downloadResume}
      aria-busy={downloading}
      className={cn(
        "inline-flex items-center gap-1.5 align-baseline text-foreground underline decoration-border underline-offset-[3px] transition-colors hover:text-accent-lime hover:decoration-accent-lime focus-visible:text-accent-lime",
        className,
      )}
      data-bippy-reaction="working"
      data-bippy-dialogue="resume"
      data-bippy-safe-zone
    >
      {downloading ? (
        <LoaderCircle
          className="size-3.5 shrink-0 animate-spin"
          aria-hidden="true"
        />
      ) : (
        <Download className="size-3.5 shrink-0" aria-hidden="true" />
      )}
      view resume
    </button>
  );
}
