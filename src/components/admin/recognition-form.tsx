"use client";

import { createElement, useState } from "react";
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
import { LineInput, LineSelect } from "@/components/admin/line-input";
import { Button } from "@/components/ui/button";
import {
  getRecognitionIcon,
  recognitionIconOptions,
} from "@/config/recognition-icons";
import type { Recognition } from "@/db/schema";
import { useAdminBase } from "@/lib/use-admin-base";
import { recognitionSchema, type RecognitionInput } from "@/lib/validation";
import { MAX_CARD_WORDS, countWords } from "@/lib/word-count";

const emptyRecognition: RecognitionInput = {
  title: "",
  iconName: "trophy",
};

export function RecognitionForm({
  recognition,
}: {
  recognition?: Recognition;
}) {
  const router = useRouter();
  const base = useAdminBase();
  const [leaving, setLeaving] = useState(false);
  const [leavingBusy, setLeavingBusy] = useState(false);
  const live = Boolean(recognition?.published);

  const form = useForm<RecognitionInput>({
    resolver: zodResolver(recognitionSchema),
    defaultValues: recognition
      ? {
          title: recognition.title,
          iconName: recognition.iconName,
          verificationUrl: recognition.verificationUrl ?? undefined,
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
  const iconName = useWatch({ control, name: "iconName" });
  const verificationUrl = useWatch({ control, name: "verificationUrl" }) ?? "";
  const preview = getRecognitionIcon(iconName);

  // "https://" is the field's starting value, so it does not count as typing.
  const hasContent = Boolean(
    title.trim() || verificationUrl.replace(/^https:\/\/$/, "").trim(),
  );

  async function persist(values: RecognitionInput, publish: boolean) {
    const result = await saveRecognition(values, recognition?.id, publish);
    if (!result.ok) {
      Object.entries(result.fields ?? {}).forEach(([name, messages]) =>
        setError(name as keyof RecognitionInput, { message: messages[0] }),
      );
      toast.error(result.message);
      return false;
    }
    return true;
  }

  async function add(values: RecognitionInput) {
    if (!(await persist(values, true))) return;
    toast.success(live ? "Recognition updated." : "Recognition added.");
    router.push(`${base}/recognitions`);
    router.refresh();
  }

  function cancel() {
    // Already on the site, or nothing written: leaving needs no decision.
    // The link counts as written work too — checking only the title threw away
    // a typed verification URL without asking.
    if (live || !hasContent) {
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
          <Button type="button" variant="ghost" onClick={cancel}>
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
            <span className="flex items-center gap-2.5">
              {/* A preview beside the picker: the option list can only say the
                  name, and the name is not the thing being chosen. */}
              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-accent">
                {preview
                  ? createElement(preview, {
                      className: "size-3.5",
                      "aria-hidden": true,
                    })
                  : null}
              </span>
              <Controller
                control={control}
                name="iconName"
                render={({ field }) => (
                  <LineSelect value={field.value} onChange={field.onChange}>
                    {recognitionIconOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </LineSelect>
                )}
              />
            </span>
          </FieldRow>
          <FieldRow label="Link" note="optional — proof or write-up">
            <LineInput
              mono
              placeholder="https://"
              invalid={Boolean(errors.verificationUrl)}
              {...register("verificationUrl")}
            />
          </FieldRow>

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
