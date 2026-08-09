"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form";
import { LoaderCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { saveSettings } from "@/app/admin/actions/settings";
import { FormTextField } from "@/components/admin/form-text-field";
import { ProfileImageField } from "@/components/admin/profile-image-field";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { availabilityOptions } from "@/config/availability";
import type { SiteSettings } from "@/db/schema";
import { cleanupUpload } from "@/lib/storage/cleanup-upload";
import { siteSettingsSchema, type SiteSettingsInput } from "@/lib/validation";

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [persistedProfileKey, setPersistedProfileKey] = useState(
    settings.profileImageKey ?? undefined,
  );
  const [persistedResumeKey, setPersistedResumeKey] = useState(
    settings.resumeKey ?? undefined,
  );
  const form = useForm<SiteSettingsInput>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      email: settings.email,
      contactLinks: settings.contactLinks,
      profileImageKey: settings.profileImageKey ?? undefined,
      resumeKey: settings.resumeKey ?? undefined,
      resumeFilename: settings.resumeFilename ?? undefined,
      hackathonWins: settings.hackathonWins,
      availability: settings.availability,
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
  const profileImageKey = useWatch({ control, name: "profileImageKey" });

  async function submit(values: SiteSettingsInput) {
    const result = await saveSettings(values);

    if (!result.ok) {
      if (values.resumeKey && values.resumeKey !== persistedResumeKey) {
        await cleanupUpload(values.resumeKey);
        setValue("resumeKey", undefined);
        setValue("resumeFilename", undefined);
      }
      if (
        values.profileImageKey &&
        values.profileImageKey !== persistedProfileKey
      ) {
        await cleanupUpload(values.profileImageKey);
        setValue("profileImageKey", undefined);
      }
      Object.entries(result.fields ?? {}).forEach(([name, messages]) =>
        setError(name as FieldPath<SiteSettingsInput>, {
          message: messages[0],
        }),
      );
      toast.error(result.message);
      return;
    }

    setPersistedProfileKey(values.profileImageKey);
    setPersistedResumeKey(values.resumeKey);
    toast.success("Site settings saved.");
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-9">
      <FieldSet>
        <FieldLegend>Profile and contacts</FieldLegend>
        <FieldGroup className="grid gap-6 sm:grid-cols-2">
          <ProfileImageField
            className="sm:col-span-2"
            value={profileImageKey}
            initialValue={persistedProfileKey}
            onChange={(key) =>
              setValue("profileImageKey", key, { shouldDirty: true })
            }
            error={errors.profileImageKey?.message}
          />
          <FormTextField
            label="Contact email"
            type="email"
            error={errors.email?.message}
            inputProps={register("email")}
          />
          <FormTextField
            label="GitHub URL"
            type="url"
            error={errors.contactLinks?.github?.message}
            inputProps={register("contactLinks.github")}
          />
          <FormTextField
            label="X (Twitter) URL"
            type="url"
            error={errors.contactLinks?.x?.message}
            inputProps={register("contactLinks.x")}
          />
          <FormTextField
            label="Instagram URL"
            type="url"
            error={errors.contactLinks?.instagram?.message}
            inputProps={register("contactLinks.instagram")}
          />
          <FormTextField
            label="TikTok URL"
            type="url"
            error={errors.contactLinks?.tiktok?.message}
            inputProps={register("contactLinks.tiktok")}
          />
          <FormTextField
            label="YouTube URL"
            type="url"
            error={errors.contactLinks?.youtube?.message}
            inputProps={register("contactLinks.youtube")}
          />
          <FormTextField
            label="LinkedIn URL"
            type="url"
            error={errors.contactLinks?.linkedin?.message}
            inputProps={register("contactLinks.linkedin")}
          />
          <FormTextField
            label="WhatsApp URL"
            type="url"
            description="Use an HTTPS link such as https://wa.me/234..."
            error={errors.contactLinks?.whatsapp?.message}
            inputProps={register("contactLinks.whatsapp")}
          />
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
        <FieldLegend>Homepage stats</FieldLegend>
        <FieldGroup className="grid gap-6 sm:grid-cols-2">
          <FormTextField
            label="Hackathon wins"
            type="number"
            description="Shown on the homepage stats strip. Leave at 0 to show a dash."
            error={errors.hackathonWins?.message}
            inputProps={register("hackathonWins", { valueAsNumber: true })}
          />
          <Controller
            control={control}
            name="availability"
            render={({ field }) => (
              <Field data-invalid={Boolean(errors.availability)}>
                <FieldLabel htmlFor="availability">Availability</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="availability"
                    className="w-full"
                    aria-invalid={Boolean(errors.availability)}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availabilityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Shown under your role in the homepage header.
                </FieldDescription>
                <FieldError>{errors.availability?.message}</FieldError>
              </Field>
            )}
          />
        </FieldGroup>
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
