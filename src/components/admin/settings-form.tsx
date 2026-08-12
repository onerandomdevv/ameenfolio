"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveSettings } from "@/app/admin/actions/settings";
import {
  AdminPage,
  FieldRow,
  SectionHeading,
} from "@/components/admin/admin-primitives";
import { LineInput, LineSelect } from "@/components/admin/line-input";
import { ProfileImageField } from "@/components/admin/profile-image-field";
import { ResumeField } from "@/components/admin/resume-field";
import { Button } from "@/components/ui/button";
import { availabilityOptions } from "@/config/availability";
import type { SiteSettings } from "@/db/schema";
import { cn } from "@/lib/utils";
import { siteSettingsSchema, type SiteSettingsInput } from "@/lib/validation";

const SEO_TITLE_MAX = 70;
const SEO_DESCRIPTION_MAX = 170;

// Every way of reaching you sits in one group — the address, then the icons.
const contactFields = [
  { name: "github", label: "GitHub" },
  { name: "x", label: "X" },
  { name: "whatsapp", label: "WhatsApp" },
  { name: "instagram", label: "Instagram" },
  { name: "linkedin", label: "LinkedIn" },
  { name: "youtube", label: "YouTube" },
  { name: "tiktok", label: "TikTok" },
] as const;

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const form = useForm<SiteSettingsInput>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      email: settings.email,
      contactLinks: settings.contactLinks ?? {},
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
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = form;

  const profileImageKey = useWatch({ control, name: "profileImageKey" });
  const resumeKey = useWatch({ control, name: "resumeKey" });
  const resumeFilename = useWatch({ control, name: "resumeFilename" });
  const availability = useWatch({ control, name: "availability" });
  const seoTitle = useWatch({ control, name: "seoTitle" }) ?? "";
  const seoDescription = useWatch({ control, name: "seoDescription" }) ?? "";

  async function submit(values: SiteSettingsInput) {
    const result = await saveSettings(values);
    if (!result.ok) {
      Object.entries(result.fields ?? {}).forEach(([name, messages]) =>
        setError(name as keyof SiteSettingsInput, {
          message: (messages as string[])[0],
        }),
      );
      toast.error(result.message);
      return;
    }
    toast.success("Settings saved.");
    router.refresh();
  }

  return (
    <AdminPage
      title="Site settings"
      description="Profile image, contact destinations, résumé, and SEO defaults."
      actions={
        <Button type="submit" form="settings-form" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle data-icon="inline-start" className="animate-spin" />
          ) : null}
          Save settings
        </Button>
      }
    >
      <form id="settings-form" onSubmit={handleSubmit(submit)}>
        <div className="max-w-[620px]">
          {/* The image and the words search engines show describe the same
              person, so they sit side by side rather than in two sections. */}
          <SectionHeading>Profile</SectionHeading>
          <div className="grid gap-6 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-start">
            <ProfileImageField
              value={profileImageKey}
              initialValue={settings.profileImageKey ?? undefined}
              onChange={(key) => setValue("profileImageKey", key)}
              error={errors.profileImageKey?.message}
            />
            <div>
              <FieldRow
                label="SEO title"
                note={
                  <span className="font-mono tabular-nums">
                    {seoTitle.length}/{SEO_TITLE_MAX}
                  </span>
                }
              >
                <LineInput
                  invalid={Boolean(errors.seoTitle)}
                  {...register("seoTitle")}
                />
              </FieldRow>
              <FieldRow
                label="SEO description"
                align="start"
                note={
                  <span className="font-mono tabular-nums">
                    {seoDescription.length}/{SEO_DESCRIPTION_MAX}
                  </span>
                }
              >
                <LineInput
                  as="textarea"
                  rows={2}
                  invalid={Boolean(errors.seoDescription)}
                  {...register("seoDescription")}
                />
              </FieldRow>
            </div>
          </div>

          <SectionHeading className="mt-8">Contact links</SectionHeading>
          <FieldRow label="Email">
            <LineInput
              mono
              invalid={Boolean(errors.email)}
              {...register("email")}
            />
          </FieldRow>
          {contactFields.map((field) => (
            <FieldRow key={field.name} label={field.label}>
              <LineInput
                mono
                placeholder="https://"
                invalid={Boolean(errors.contactLinks?.[field.name])}
                {...register(`contactLinks.${field.name}`)}
              />
            </FieldRow>
          ))}

          <SectionHeading className="mt-8">Résumé</SectionHeading>
          <ResumeField
            fileKey={resumeKey}
            filename={resumeFilename}
            onChange={(key, filename) => {
              setValue("resumeKey", key, { shouldDirty: true });
              setValue("resumeFilename", filename, { shouldDirty: true });
            }}
            error={errors.resumeKey?.message}
          />

          <SectionHeading className="mt-8">Homepage</SectionHeading>
          <FieldRow label="Hackathon wins">
            <LineInput
              type="number"
              min={0}
              max={99}
              className="font-mono tabular-nums"
              invalid={Boolean(errors.hackathonWins)}
              {...register("hackathonWins", { valueAsNumber: true })}
            />
          </FieldRow>
          <FieldRow label="Availability" note="shown under your name">
            <span className="flex items-center gap-2">
              {/* Availability is a status, so it says so before it is read. */}
              <span
                aria-hidden="true"
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  availability === "open"
                    ? "bg-accent-lime"
                    : "bg-muted-foreground",
                )}
              />
              <Controller
                control={control}
                name="availability"
                render={({ field }) => (
                  <LineSelect value={field.value} onChange={field.onChange}>
                    {availabilityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </LineSelect>
                )}
              />
            </span>
          </FieldRow>
        </div>
      </form>
    </AdminPage>
  );
}
