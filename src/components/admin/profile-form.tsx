"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveProfile } from "@/app/admin/actions/settings";
import {
  AdminPage,
  FieldRow,
  SectionHeading,
} from "@/components/admin/admin-primitives";
import { AvailabilityPicker } from "@/components/admin/availability-picker";
import { LineInput } from "@/components/admin/line-input";
import { ProfileImageField } from "@/components/admin/profile-image-field";
import { ResumeField } from "@/components/admin/resume-field";
import { Button } from "@/components/ui/button";
import { instrumentSerif } from "@/app/fonts";
import type { SiteSettings } from "@/db/schema";
import { resolveIdentity } from "@/lib/identity";
import { profileSchema, type ProfileInput } from "@/lib/validation";

const INTRODUCTION_MAX = 600;

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

export function ProfileForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  // The same resolution the site uses, so the field opens showing exactly what
  // visitors currently read rather than an empty box.
  const identity = resolveIdentity(settings);
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: identity.name,
      role: identity.role,
      introduction: identity.introduction,
      email: settings.email,
      contactLinks: settings.contactLinks ?? {},
      profileImageKey: settings.profileImageKey ?? undefined,
      resumeKey: settings.resumeKey ?? undefined,
      resumeFilename: settings.resumeFilename ?? undefined,
      hackathonWins: settings.hackathonWins,
      availability: settings.availability,
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
  const introduction = useWatch({ control, name: "introduction" }) ?? "";

  async function submit(values: ProfileInput) {
    const result = await saveProfile(values);
    if (!result.ok) {
      Object.entries(result.fields ?? {}).forEach(([name, messages]) =>
        setError(name as keyof ProfileInput, {
          message: (messages as string[])[0],
        }),
      );
      toast.error(result.message);
      return;
    }
    toast.success("Profile saved.");
    router.refresh();
  }

  return (
    <AdminPage
      title="Profile"
      actions={
        <Button type="submit" form="profile-form" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle data-icon="inline-start" className="animate-spin" />
          ) : null}
          Save profile
        </Button>
      }
    >
      <form id="profile-form" onSubmit={handleSubmit(submit)}>
        <div className="max-w-[620px]">
          {/* The photo and the words beside it are the same introduction, so
              they sit together — side by side on a desktop, stacked under the
              image on a phone. */}
          <SectionHeading>Profile</SectionHeading>
          <div className="grid gap-6 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-start">
            <ProfileImageField
              value={profileImageKey}
              initialValue={settings.profileImageKey ?? undefined}
              onChange={(key) => setValue("profileImageKey", key)}
              error={errors.profileImageKey?.message}
            />
            <div>
              <FieldRow label="Name">
                {/* The same serif the homepage sets it in, so what you type
                    looks like what visitors read. */}
                <LineInput
                  className={`${instrumentSerif.className} text-[19px] leading-tight`}
                  invalid={Boolean(errors.displayName)}
                  {...register("displayName")}
                />
              </FieldRow>
              <FieldRow label="Role">
                <LineInput
                  placeholder="e.g. Full-Stack Engineer"
                  invalid={Boolean(errors.role)}
                  {...register("role")}
                />
              </FieldRow>
              <FieldRow
                label="Description"
                align="start"
                note={
                  <span className="font-mono tabular-nums">
                    {introduction.length}/{INTRODUCTION_MAX}
                  </span>
                }
              >
                <LineInput
                  as="textarea"
                  rows={5}
                  maxLength={INTRODUCTION_MAX}
                  invalid={Boolean(errors.introduction)}
                  {...register("introduction")}
                />
              </FieldRow>
              <p className="mt-1.5 text-[11.5px] leading-5 text-muted-foreground">
                Enter starts a new line. Wrap a phrase in **double asterisks**
                to make it bold and underlined.
              </p>
            </div>
          </div>

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
            <Controller
              control={control}
              name="availability"
              render={({ field }) => (
                <AvailabilityPicker
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </FieldRow>

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
        </div>
      </form>
    </AdminPage>
  );
}
