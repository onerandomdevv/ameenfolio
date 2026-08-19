"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  deleteRecognition,
  saveRecognition,
} from "@/app/admin/actions/recognitions";
import {
  AdminPage,
  FieldNote,
  FieldRow,
  SectionHeading,
} from "@/components/admin/admin-primitives";
import { LeaveGuard } from "@/components/admin/leave-guard";
import { cleanupUpload } from "@/lib/storage/cleanup-upload";
import { LineInput } from "@/components/admin/line-input";
import { OptionPicker } from "@/components/admin/option-picker";
import {
  RecognitionImagesField,
  type RecognitionImageValue,
} from "@/components/admin/recognition-images-field";
import { Button } from "@/components/ui/button";
import { recognitionIconOptions } from "@/config/recognition-icons";
import type { Recognition } from "@/db/schema";
import { useAdminBase } from "@/lib/use-admin-base";
import {
  recognitionFormSchema,
  type RecognitionFormInput,
} from "@/lib/validation";
import { MAX_CARD_WORDS, countWords } from "@/lib/word-count";

const emptyRecognition: RecognitionFormInput = {
  title: "",
  iconName: "trophy",
  images: [],
};

export function RecognitionForm({
  recognition,
  images = [],
  postOptions = [],
}: {
  recognition?: Recognition;
  images?: RecognitionImageValue[];
  postOptions?: { id: string; title: string }[];
}) {
  // Captured once. These are the keys already live on the site, so removing one
  // must not delete the object from storage until the form is actually saved.
  const [initialImageKeys] = useState(() =>
    images.map((image) => image.objectKey),
  );
  const router = useRouter();
  const base = useAdminBase();
  const [leaving, setLeaving] = useState(false);
  const [leavingBusy, setLeavingBusy] = useState(false);
  const live = Boolean(recognition?.published);

  const form = useForm<RecognitionFormInput>({
    resolver: zodResolver(recognitionFormSchema),
    defaultValues: recognition
      ? {
          title: recognition.title,
          iconName: recognition.iconName,
          verificationUrl: recognition.verificationUrl ?? undefined,
          articlePostId: recognition.articlePostId ?? undefined,
          images,
        }
      : emptyRecognition,
  });
  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
    setError,
  } = form;

  const title = useWatch({ control, name: "title" }) ?? "";
  const verificationUrl = useWatch({ control, name: "verificationUrl" }) ?? "";
  const articlePostId = useWatch({ control, name: "articlePostId" });
  const imageCount = (useWatch({ control, name: "images" }) ?? []).length;

  // "https://" is the field's starting value, so it does not count as typing.
  //
  // Images count as written work too, and more so than the rest: they are
  // already uploaded by this point, so leaving without asking would discard
  // them and strand the objects in storage. Same reasoning that added the
  // verification URL here after checking the title alone threw one away.
  const hasContent = Boolean(
    title.trim() ||
    verificationUrl.replace(/^https:\/\/$/, "").trim() ||
    articlePostId ||
    imageCount,
  );

  async function persist(values: RecognitionFormInput, publish: boolean) {
    const result = await saveRecognition(values, recognition?.id, publish);
    if (!result.ok) {
      Object.entries(result.fields ?? {}).forEach(([name, messages]) =>
        setError(name as keyof RecognitionFormInput, { message: messages[0] }),
      );
      toast.error(result.message);
      return false;
    }
    return true;
  }

  async function add(values: RecognitionFormInput) {
    if (!(await persist(values, true))) return;
    toast.success(live ? "Recognition updated." : "Recognition added.");
    router.push(`${base}/recognitions`);
    router.refresh();
  }

  /**
   * Deletes the objects this session uploaded and is now walking away from.
   *
   * Only keys absent from `initialImageKeys`: those were already live before
   * the form opened, so leaving without saving must not touch them. Awaited
   * before navigating away, since the component unmounts on push and a
   * pending request would be cancelled with it.
   */
  async function discardSessionUploads() {
    const stranded = (getValues("images") ?? [])
      .map((image) => image.objectKey)
      .filter((key) => !initialImageKeys.includes(key));
    await Promise.all(stranded.map((key) => cleanupUpload(key)));
  }

  async function cancel() {
    // Already on the site, or nothing written: leaving needs no decision.
    // The link counts as written work too — checking only the title threw away
    // a typed verification URL without asking.
    if (live || !hasContent) {
      await discardSessionUploads();
      router.push(`${base}/recognitions`);
      return;
    }
    setLeaving(true);
  }

  // A flag of its own: `isSubmitting` only covers handlers run through
  // handleSubmit, and these are called straight from the leave guard. Without
  // it the guard's buttons stay live for the whole request, and a second click
  // adds a second recognition.
  async function saveDraft() {
    if (leavingBusy) return;
    setLeavingBusy(true);
    try {
      if (!(await persist(getValues(), false))) return;
      setLeaving(false);
      toast.success("Saved as a draft.");
      router.push(`${base}/recognitions`);
      router.refresh();
    } finally {
      setLeavingBusy(false);
    }
  }

  async function discard() {
    if (leavingBusy) return;
    setLeavingBusy(true);
    try {
      setLeaving(false);
      await discardSessionUploads();
      if (recognition) await deleteRecognition(recognition.id);
      router.push(`${base}/recognitions`);
      router.refresh();
    } finally {
      setLeavingBusy(false);
    }
  }

  return (
    <AdminPage
      title={recognition ? "Edit recognition" : "Add recognition"}
      actions={
        <>
          <Button type="button" variant="ghost" onClick={() => void cancel()}>
            Cancel
          </Button>
          <Button type="submit" form="recognition-form" disabled={isSubmitting}>
            {isSubmitting ? (
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
            ) : null}
            {recognition ? "Save" : "Add"}
          </Button>
        </>
      }
    >
      <form id="recognition-form" onSubmit={handleSubmit(add)}>
        <div className="max-w-[620px]">
          <SectionHeading>Recognition</SectionHeading>
          <FieldRow
            label="Title"
            align="start"
            note={
              <span className="font-mono tabular-nums">
                {countWords(title)}/{MAX_CARD_WORDS} words
              </span>
            }
          >
            <LineInput
              as="textarea"
              rows={2}
              placeholder="e.g. #1st | Hackathon name."
              invalid={Boolean(errors.title)}
              {...register("title")}
            />
          </FieldRow>
          <FieldRow label="Icon" note="shown before the text">
            {/* The separate preview this used to need is gone: the picker now
                shows the mark on its own trigger and beside every option, so
                the icon is chosen by looking at icons rather than at names. */}
            <Controller
              control={control}
              name="iconName"
              render={({ field }) => (
                <OptionPicker
                  title="Choose an icon"
                  value={field.value}
                  onChange={field.onChange}
                  options={recognitionIconOptions}
                />
              )}
            />
          </FieldRow>
          <FieldRow label="Link" note="optional — proof or write-up">
            <LineInput
              mono
              placeholder="https://"
              invalid={Boolean(errors.verificationUrl)}
              {...register("verificationUrl")}
            />
          </FieldRow>
          <FieldRow label="Article" note="optional — opens Read Post">
            <Controller
              control={control}
              name="articlePostId"
              render={({ field }) => (
                <OptionPicker
                  title="Choose an article"
                  value={field.value ?? ""}
                  // "" is the picker's way of saying none; the column is
                  // nullable, so it has to go back as undefined rather than an
                  // empty string that would fail the uuid check.
                  onChange={(next) => field.onChange(next || undefined)}
                  options={postOptions.map((option) => ({
                    value: option.id,
                    label: option.title,
                  }))}
                  placeholder="None"
                  clearable
                />
              )}
            />
          </FieldRow>

          <Controller
            control={control}
            name="images"
            render={({ field }) => (
              <RecognitionImagesField
                value={field.value ?? []}
                initialKeys={initialImageKeys}
                onChange={field.onChange}
                error={errors.images?.message}
                className="mt-6"
              />
            )}
          />

          <FieldNote>
            {live
              ? "Pin it from the recognitions list to show it on the homepage."
              : "Adding puts this on the site. Pin it from the recognitions list afterwards to show it on the homepage."}
          </FieldNote>
        </div>
      </form>

      <LeaveGuard
        open={leaving}
        noun="recognition"
        onOpenChange={setLeaving}
        onDiscard={discard}
        onSaveDraft={saveDraft}
        saving={leavingBusy}
      />
    </AdminPage>
  );
}
