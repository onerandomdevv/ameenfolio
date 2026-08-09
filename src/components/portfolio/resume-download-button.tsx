"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ResumeDownloadButtonProps = {
  hasResume: boolean;
  filename: string | null;
};

export function ResumeDownloadButton({
  hasResume,
  filename,
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
    <Button
      type="button"
      variant="link"
      onClick={downloadResume}
      aria-busy={downloading}
      className="absolute right-0 bg-background pl-4 pr-0 font-bold text-foreground underline hover:text-primary"
      data-bippy-reaction="working"
      data-bippy-safe-zone
    >
      {downloading ? (
        <LoaderCircle data-icon="inline-start" className="animate-spin" />
      ) : (
        <Download data-icon="inline-start" />
      )}
      View Resume
    </Button>
  );
}
