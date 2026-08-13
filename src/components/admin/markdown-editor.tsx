"use client";

import { useRef, useState } from "react";
import { Eye, ImagePlus, LoaderCircle, PenLine } from "lucide-react";
import { previewMarkdown } from "@/app/admin/actions/writing";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { uploadFile } from "@/lib/storage/client";

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

// Inserted at the cursor rather than appended, so an image can go in the middle
// of a paragraph being written instead of always landing at the end.
function insertAt(text: string, snippet: string, from: number, to: number) {
  return `${text.slice(0, from)}${snippet}${text.slice(to)}`;
}

export function MarkdownEditor({
  value,
  onChange,
  error,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  const [preview, setPreview] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);

  async function showPreview() {
    setRendering(true);
    setUploadError(undefined);
    try {
      // Rendered on the server by the same function the save path uses, so the
      // preview cannot disagree with the published post — including what the
      // sanitiser strips.
      const result = await previewMarkdown(textareaRef.current?.value ?? value);
      if (!result.ok) {
        setUploadError(result.message);
        return;
      }
      setPreview(result.html);
    } finally {
      setRendering(false);
    }
  }

  async function upload(file: File) {
    setPending(true);
    setUploadError(undefined);
    try {
      const { key } = await uploadFile("post", file);
      // The alt text is seeded from the filename rather than left blank: an
      // empty alt is easy to leave behind, and a wrong-but-present one is at
      // least visible in the editor and gets corrected.
      const alt = file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
      const snippet = `\n\n![${alt}](/media/${key})\n\n`;
      // Read live, after the upload, rather than from the value captured when
      // it started: an upload takes seconds, and anything typed meanwhile
      // would be overwritten by splicing into the older text.
      const textarea = textareaRef.current;
      const current = textarea?.value ?? value;
      const from = Math.min(
        textarea?.selectionStart ?? current.length,
        current.length,
      );
      const to = Math.min(textarea?.selectionEnd ?? from, current.length);
      onChange(insertAt(current, snippet, from, to));
      // Put the caret after what was just inserted so typing continues below
      // the image instead of before it.
      requestAnimationFrame(() => {
        const caret = from + snippet.length;
        textarea?.focus();
        textarea?.setSelectionRange(caret, caret);
      });
    } catch (failure) {
      setUploadError(
        failure instanceof Error ? failure.message : "Upload failed.",
      );
    } finally {
      setPending(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const invalid = Boolean(error || uploadError);

  return (
    <Field data-invalid={invalid} data-disabled={pending}>
      <div className="flex items-center justify-between gap-3">
        <FieldLabel htmlFor="bodyMarkdown">Body</FieldLabel>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || rendering}
            onClick={() =>
              preview !== null ? setPreview(null) : void showPreview()
            }
          >
            {rendering ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : preview !== null ? (
              <PenLine aria-hidden="true" />
            ) : (
              <Eye aria-hidden="true" />
            )}
            {preview !== null ? "Write" : "Preview"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || rendering || preview !== null}
            onClick={() => fileRef.current?.click()}
          >
            {pending ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus aria-hidden="true" />
            )}
            Insert image
          </Button>
        </div>
      </div>
      {preview !== null ? (
        // The same class the published post uses, so this is the post's own
        // styling rather than an approximation of it.
        <article
          className="post-body min-h-[24rem]"
          dangerouslySetInnerHTML={{ __html: preview }}
        />
      ) : (
        /* No box. What is being written becomes a page, so a bordered field
           around it framed the text as form input rather than prose — and the
           preview would then look nothing like the thing above it. */
        <textarea
          id="bodyMarkdown"
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={22}
          spellCheck
          // Locked while the render is in flight. The markdown is captured
          // when Preview is pressed, so anything typed during the round trip
          // would be missing from what comes back — a preview of text the box
          // no longer holds.
          readOnly={rendering}
          className="w-full resize-y bg-transparent p-0 font-mono text-[13px] leading-6 text-foreground outline-none placeholder:text-muted-foreground/70"
          placeholder={"## A section\n\nWrite in Markdown."}
        />
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <FieldDescription>
        Markdown. Use ## for the sections that become the contents list on the
        post. Images upload to your own storage and are inserted where the
        cursor is.
      </FieldDescription>
      {invalid ? <FieldError>{error ?? uploadError}</FieldError> : null}
    </Field>
  );
}
