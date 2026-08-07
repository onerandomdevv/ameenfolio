"use client";

import { useState } from "react";
import { LoaderCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";

export function UploadField({ resourceType, value, onChange, error }: { resourceType: "icon" | "resume"; value?: string; onChange: (key: string, filename: string) => void; error?: string }) {
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string>();
  const accept = resourceType === "icon" ? "image/png,image/jpeg,image/webp" : "application/pdf";

  async function upload(file: File) {
    setPending(true);
    setLocalError(undefined);
    try {
      const signed = await fetch("/api/admin/uploads/sign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resourceType, filename: file.name, contentType: file.type, size: file.size }) });
      if (!signed.ok) throw new Error("This file is not allowed.");
      const payload = await signed.json() as { uploadUrl: string; key: string };
      const sent = await fetch(payload.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!sent.ok) throw new Error("Upload failed before the file was saved.");
      onChange(payload.key, file.name);
    } catch (uploadError) {
      setLocalError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally { setPending(false); }
  }

  return <Field data-invalid={Boolean(error || localError)}><FieldLabel>{resourceType === "icon" ? "Icon" : "Résumé PDF"}</FieldLabel><div className="flex flex-wrap items-center gap-3"><Button type="button" variant="outline" disabled={pending} asChild><label className="cursor-pointer">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />} {pending ? "Uploading…" : "Choose file"}<input className="sr-only" type="file" accept={accept} disabled={pending} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} /></label></Button>{value ? <span className="max-w-full truncate font-mono text-xs text-accent-lime">Uploaded</span> : null}</div><FieldDescription>{resourceType === "icon" ? "PNG, JPEG, or WebP up to 2 MB." : "PDF up to 10 MB. Downloads as an attachment."}</FieldDescription><FieldError>{error ?? localError}</FieldError></Field>;
}
