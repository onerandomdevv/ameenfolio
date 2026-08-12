"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveSeo } from "@/app/admin/actions/settings";
import {
  AdminPage,
  FieldRow,
  SectionHeading,
} from "@/components/admin/admin-primitives";
import { LineInput } from "@/components/admin/line-input";
import { Button } from "@/components/ui/button";
import type { SiteSettings } from "@/db/schema";
import { seoSchema, type SeoInput } from "@/lib/validation";

const SEO_TITLE_MAX = 70;
const SEO_DESCRIPTION_MAX = 170;

// Everything about you moved to Profile. What is left is what a search result
// and a shared link show, which is about the site rather than the person.
export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const form = useForm<SeoInput>({
    resolver: zodResolver(seoSchema),
    defaultValues: {
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
  } = form;

  const seoTitle = useWatch({ control, name: "seoTitle" }) ?? "";
  const seoDescription = useWatch({ control, name: "seoDescription" }) ?? "";

  async function submit(values: SeoInput) {
    const result = await saveSeo(values);
    if (!result.ok) {
      Object.entries(result.fields ?? {}).forEach(([name, messages]) =>
        setError(name as keyof SeoInput, {
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
          <SectionHeading>SEO</SectionHeading>
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
      </form>
    </AdminPage>
  );
}
