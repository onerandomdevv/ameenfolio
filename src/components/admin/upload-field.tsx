"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { uploadFile } from "@/lib/storage/client";

type UploadFieldProps = {
  resourceType: "icon" | "resume";
  value?: string;
  onChange: (key: string, filename: string) => void;
  error?: string;
  className?: string;
};

export function UploadField({
  resourceType,
  value,
  onChange,
  error,
  className,
}: UploadFieldProps) {
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string>();
  const accept =
    resourceType === "icon"
      ? "image/png,image/jpeg,image/webp"
      : "application/pdf";
  const invalid = Boolean(error || localError);

  async function upload(file: File) {
    setPending(true);
    setLocalError(undefined);

    try {
      const payload = await uploadFile(resourceType, file);
      onChange(payload.key, file.name);
    } catch (uploadError) {
      setLocalError(
        uploadError instanceof Error ? uploadError.message : "Upload failed.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Field
      className={cn(className)}
      data-invalid={invalid}
      data-disabled={pending}
    >
      <div className="flex items-center justify-between gap-3">
        <FieldLabel htmlFor={`${resourceType}-upload`}>
          {resourceType === "icon" ? "Icon" : "Résumé PDF"}
        </FieldLabel>
        {value ? <Badge variant="secondary">Uploaded</Badge> : null}
      </div>
      <Input
        id={`${resourceType}-upload`}
        type="file"
        accept={accept}
        disabled={pending}
        aria-invalid={invalid}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <FieldDescription>
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <LoaderCircle className="size-4 animate-spin" />
            Uploading…
          </span>
        ) : resourceType === "icon" ? (
          "PNG, JPEG, or WebP up to 2 MB."
        ) : (
          "PDF up to 10 MB. Downloads as an attachment."
        )}
      </FieldDescription>
      <FieldError>{error ?? localError}</FieldError>
    </Field>
  );
}
