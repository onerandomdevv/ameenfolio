"use client";

import { useRef, useState } from "react";
import { FileText, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadFile } from "@/lib/storage/client";
import { cn } from "@/lib/utils";

// One row: what the file is, then the three things you can do with it. View is
// off when there is nothing to view rather than hidden, so the row keeps its
// shape whether or not a résumé has been uploaded.
export function ResumeField({
  fileKey,
  filename,
  onChange,
  error,
}: {
  fileKey?: string;
  filename?: string;
  onChange: (key: string | undefined, filename: string | undefined) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string>();

  async function upload(file: File) {
    setUploading(true);
    setLocalError(undefined);
    try {
      const payload = await uploadFile("resume", file);
      onChange(payload.key, file.name);
      toast.success("Résumé uploaded. Save to publish it.");
    } catch (failure) {
      setLocalError(
        failure instanceof Error ? failure.message : "Upload failed.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const problem = error ?? localError;

  return (
    <div className="border-b border-border/60 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-[13px] text-muted-foreground">Résumé PDF</span>

        <span className="flex min-w-0 flex-1 basis-[10rem] items-center gap-2">
          <FileText
            className={cn(
              "size-4 shrink-0",
              fileKey ? "text-foreground" : "text-muted-foreground/50",
            )}
            aria-hidden="true"
          />
          <span
            className={cn(
              "truncate font-mono text-[12.5px]",
              fileKey ? "text-foreground" : "text-muted-foreground/70",
            )}
          >
            {uploading
              ? "Uploading…"
              : fileKey
                ? (filename ?? "resume.pdf")
                : "No file"}
          </span>
        </span>

        <span className="ml-auto flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
            ) : null}
            Upload file
          </Button>

          {fileKey ? (
            <Button asChild variant="outline" size="sm">
              <a href="/resume?inline=1" target="_blank" rel="noreferrer">
                View file
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              View file
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!fileKey || uploading}
            onClick={() => onChange(undefined, undefined)}
            className="text-destructive hover:text-destructive"
          >
            Delete
          </Button>
        </span>
      </div>

      {problem ? (
        <p className="mt-1.5 text-[11.5px] text-destructive">{problem}</p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        style={{ width: 1, height: 1 }}
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
    </div>
  );
}
