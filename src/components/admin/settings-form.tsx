"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { LoaderCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { saveSettings } from "@/app/admin/actions/settings";
import { FormTextField } from "@/components/admin/form-text-field";
import { UploadField } from "@/components/admin/upload-field";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { SiteSettings } from "@/db/schema";
import { cleanupUpload } from "@/lib/storage/cleanup-upload";
import { siteSettingsSchema, type SiteSettingsInput } from "@/lib/validation";

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [socialText, setSocialText] = useState(
    settings.socialLinks
      .map((link) => `${link.label} | ${link.url}`)
      .join("\n"),
  );
  const form = useForm<SiteSettingsInput>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      name: settings.name,
      role: settings.role,
      introduction: settings.introduction,
      email: settings.email,
      socialLinks: settings.socialLinks,
      resumeKey: settings.resumeKey ?? undefined,
      resumeFilename: settings.resumeFilename ?? undefined,
      seoTitle: settings.seoTitle,
      seoDescription: settings.seoDescription,
    },
  });
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = form;
  const resumeKey = useWatch({ control, name: "resumeKey" });
  const resumeFilename = useWatch({ control, name: "resumeFilename" });

  async function submit(values: SiteSettingsInput) {
    const socialLinks = socialText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, ...url] = line.split("|");
        return { label: label.trim(), url: url.join("|").trim() };
      });
    const result = await saveSettings({ ...values, socialLinks });

    if (!result.ok) {
      if (values.resumeKey && values.resumeKey !== settings.resumeKey) {
        await cleanupUpload(values.resumeKey);
        setValue("resumeKey", undefined);
        setValue("resumeFilename", undefined);
      }
      Object.entries(result.fields ?? {}).forEach(([name, messages]) =>
        setError(name as keyof SiteSettingsInput, { message: messages[0] }),
      );
      toast.error(result.message);
      return;
    }

    toast.success("Site settings saved.");
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-9">
      <FieldSet>
        <FieldLegend>Hero and contact</FieldLegend>
        <FieldGroup className="grid gap-6 sm:grid-cols-2">
          <FormTextField
            label="Name"
            error={errors.name?.message}
            inputProps={register("name")}
          />
          <FormTextField
            label="Role"
            error={errors.role?.message}
            inputProps={register("role")}
          />
          <Field
            className="sm:col-span-2"
            data-invalid={Boolean(errors.introduction)}
          >
            <FieldLabel htmlFor="introduction">Introduction</FieldLabel>
            <Textarea
              id="introduction"
              rows={5}
              aria-invalid={Boolean(errors.introduction)}
              {...register("introduction")}
            />
            <FieldError>{errors.introduction?.message}</FieldError>
          </Field>
          <FormTextField
            label="Contact email"
            type="email"
            error={errors.email?.message}
            inputProps={register("email")}
          />
          <Field
            className="sm:col-span-2"
            data-invalid={Boolean(errors.socialLinks)}
          >
            <FieldLabel htmlFor="social-links">Social links</FieldLabel>
            <Textarea
              id="social-links"
              rows={5}
              value={socialText}
              aria-invalid={Boolean(errors.socialLinks)}
              onChange={(event) => setSocialText(event.target.value)}
              placeholder={
                "GitHub | https://github.com/username\nLinkedIn | https://linkedin.com/in/username"
              }
            />
            <FieldDescription>
              One per line as Label | HTTPS URL. Up to eight links.
            </FieldDescription>
            <FieldError>{errors.socialLinks?.message}</FieldError>
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Résumé</FieldLegend>
        <UploadField
          resourceType="resume"
          value={resumeKey}
          onChange={(key, filename) => {
            setValue("resumeKey", key, { shouldDirty: true });
            setValue("resumeFilename", filename, { shouldDirty: true });
          }}
          error={errors.resumeKey?.message}
        />
        {resumeFilename ? (
          <FieldDescription>
            Current filename: {resumeFilename}
          </FieldDescription>
        ) : null}
      </FieldSet>

      <FieldSet>
        <FieldLegend>Search metadata</FieldLegend>
        <FieldGroup>
          <FormTextField
            label="Default SEO title"
            error={errors.seoTitle?.message}
            inputProps={register("seoTitle")}
          />
          <Field data-invalid={Boolean(errors.seoDescription)}>
            <FieldLabel htmlFor="seoDescription">
              Default SEO description
            </FieldLabel>
            <Textarea
              id="seoDescription"
              rows={4}
              aria-invalid={Boolean(errors.seoDescription)}
              {...register("seoDescription")}
            />
            <FieldDescription>Aim for 140–160 characters.</FieldDescription>
            <FieldError>{errors.seoDescription?.message}</FieldError>
          </Field>
        </FieldGroup>
      </FieldSet>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle data-icon="inline-start" className="animate-spin" />
          ) : (
            <Save data-icon="inline-start" />
          )}
          Save settings
        </Button>
      </div>
    </form>
  );
}
