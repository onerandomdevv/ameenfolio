"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteProject, saveProject } from "@/app/admin/actions/projects";
import {
  AdminPage,
  FieldNote,
  FieldRow,
  SectionHeading,
} from "@/components/admin/admin-primitives";
import { LeaveGuard } from "@/components/admin/leave-guard";
import { LineInput, LineSelect } from "@/components/admin/line-input";
import { UploadField } from "@/components/admin/upload-field";
import { Button } from "@/components/ui/button";
import { projectIconOptions } from "@/config/project-icons";
import type { Project } from "@/db/schema";
import { cleanupUpload } from "@/lib/storage/cleanup-upload";
import { useAdminBase } from "@/lib/use-admin-base";
import { projectSchema, type ProjectInput } from "@/lib/validation";
import { MAX_CARD_WORDS, countWords } from "@/lib/word-count";

const emptyProject: ProjectInput = {
  title: "",
  shortDescription: "",
  url: "https://",
  iconName: "custom",
};

export function ProjectForm({ project }: { project?: Project }) {
  const router = useRouter();
  const base = useAdminBase();
  const [leaving, setLeaving] = useState(false);
  const live = Boolean(project?.published);

  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: project
      ? {
          title: project.title,
          shortDescription: project.shortDescription,
          contribution: project.contribution ?? undefined,
          statusLabel: project.statusLabel ?? undefined,
          url: project.url,
          iconKey: project.iconKey ?? undefined,
          iconAlt: project.iconAlt ?? undefined,
          iconName: project.iconName,
        }
      : emptyProject,
  });
  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = form;

  const iconName = useWatch({ control, name: "iconName" });
  const iconKey = useWatch({ control, name: "iconKey" });
  const description = useWatch({ control, name: "shortDescription" }) ?? "";
  const title = useWatch({ control, name: "title" }) ?? "";

  // What "unsaved work" means: anything typed. An untouched form has nothing
  // worth keeping, so leaving it needs no decision.
  const hasContent = Boolean(title.trim() || description.trim());

  async function persist(values: ProjectInput, publish: boolean) {
    const result = await saveProject(values, project?.id, publish);
    if (!result.ok) {
      if (values.iconKey && values.iconKey !== project?.iconKey) {
        await cleanupUpload(values.iconKey);
        setValue("iconKey", undefined);
      }
      Object.entries(result.fields ?? {}).forEach(([name, messages]) =>
        setError(name as keyof ProjectInput, { message: messages[0] }),
      );
      toast.error(result.message);
      return false;
    }
    return true;
  }

  async function post(values: ProjectInput) {
    if (!(await persist(values, true))) return;
    toast.success(live ? "Project updated." : "Project posted.");
    router.push(`${base}/projects`);
    router.refresh();
  }

  function cancel() {
    // Already on the site, or nothing written: leaving needs no decision.
    if (live || !hasContent) {
      router.push(`${base}/projects`);
      return;
    }
    setLeaving(true);
  }

  async function saveDraft() {
    const values = getValues();
    if (!(await persist(values, false))) return;
    setLeaving(false);
    toast.success("Saved as a draft.");
    router.push(`${base}/projects`);
    router.refresh();
  }

  async function discard() {
    setLeaving(false);
    if (project) await deleteProject(project.id);
    router.push(`${base}/projects`);
    router.refresh();
  }

  const words = countWords(description);

  return (
    <AdminPage
      title={project ? "Edit project" : "New project"}
      actions={
        <>
          <Button type="button" variant="ghost" onClick={cancel}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" disabled={isSubmitting}>
            {isSubmitting ? (
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
            ) : null}
            Post
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={handleSubmit(post)}>
        <div className="max-w-[620px]">
          <SectionHeading>Project</SectionHeading>
          <FieldRow label="Title" note={errors.title ? "required" : undefined}>
            <LineInput
              placeholder="Name of the project"
              invalid={Boolean(errors.title)}
              {...register("title")}
            />
          </FieldRow>
          <FieldRow
            label="Description"
            align="start"
            note={
              <span className="font-mono tabular-nums">
                {words}/{MAX_CARD_WORDS} words
              </span>
            }
          >
            <LineInput
              as="textarea"
              rows={2}
              placeholder="What it does, in twelve words"
              invalid={Boolean(errors.shortDescription)}
              {...register("shortDescription")}
            />
          </FieldRow>
          <FieldRow label="Contribution" note="optional">
            <LineInput
              placeholder="e.g. Founding Engineer"
              {...register("contribution")}
            />
          </FieldRow>
          <FieldRow label="Status label" note="optional">
            <LineInput placeholder="e.g. Live" {...register("statusLabel")} />
          </FieldRow>
          <FieldRow label="URL" note={errors.url ? "https:// only" : undefined}>
            <LineInput
              mono
              placeholder="https://"
              invalid={Boolean(errors.url)}
              {...register("url")}
            />
          </FieldRow>
          <FieldNote>
            One destination — clicking the card on the site follows this.
          </FieldNote>

          <SectionHeading className="mt-8">Icon</SectionHeading>
          <FieldRow label="Source" note="for a project with no logo">
            <Controller
              control={control}
              name="iconName"
              render={({ field }) => (
                <LineSelect value={field.value} onChange={field.onChange}>
                  {projectIconOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </LineSelect>
              )}
            />
          </FieldRow>
          {iconName === "custom" ? (
            <>
              <FieldRow label="Image" align="start">
                <UploadField
                  resourceType="icon"
                  value={iconKey}
                  onChange={(key) => setValue("iconKey", key)}
                  error={errors.iconKey?.message}
                />
              </FieldRow>
              <FieldRow
                label="Alt text"
                note={errors.iconAlt ? "required with an upload" : undefined}
              >
                <LineInput
                  placeholder="Describe the image"
                  invalid={Boolean(errors.iconAlt)}
                  {...register("iconAlt")}
                />
              </FieldRow>
            </>
          ) : null}

          <FieldNote>
            {live
              ? "Pin it from the projects list to show it on the homepage."
              : "Posting puts this on the site. Pin it from the projects list afterwards to show it on the homepage."}
          </FieldNote>
        </div>
      </form>

      <LeaveGuard
        open={leaving}
        noun="project"
        onOpenChange={setLeaving}
        onDiscard={discard}
        onSaveDraft={saveDraft}
        saving={isSubmitting}
      />
    </AdminPage>
  );
}
