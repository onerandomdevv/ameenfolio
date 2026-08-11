"use client";

import { createElement } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveProject } from "@/app/admin/actions/projects";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  homepageOrder: 0,
  showOnHomepage: false,
  published: false,
};

export function ProjectForm({ project }: { project?: Project }) {
  const router = useRouter();
  const base = useAdminBase();
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
          showOnHomepage: project.showOnHomepage,
          homepageOrder: project.homepageOrder,
          published: project.published,
        }
      : emptyProject,
  });
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = form;
  const iconKey = useWatch({ control, name: "iconKey" });
  const iconName = useWatch({ control, name: "iconName" });
  const shortDescription = useWatch({ control, name: "shortDescription" });
  const descriptionWords = countWords(shortDescription ?? "");

  async function submit(values: ProjectInput) {
    const result = await saveProject(values, project?.id);
    if (!result.ok) {
      if (values.iconKey && values.iconKey !== project?.iconKey) {
        await cleanupUpload(values.iconKey);
        setValue("iconKey", undefined);
      }
      Object.entries(result.fields ?? {}).forEach(([name, messages]) =>
        setError(name as keyof ProjectInput, { message: messages[0] }),
      );
      toast.error(result.message);
      return;
    }

    toast.success(project ? "Project updated." : "Project created.");
    router.push(`${base}/projects`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-8">
      <FieldSet>
        <FieldLegend>Project details</FieldLegend>
        <FieldGroup className="grid gap-6 sm:grid-cols-2">
          <FormTextField
            label="Title"
            error={errors.title?.message}
            inputProps={register("title")}
          />
          <FormTextField
            label="Status label"
            description="Optional, e.g. Live or In development."
            error={errors.statusLabel?.message}
            inputProps={register("statusLabel")}
          />
          <Field
            className="sm:col-span-2"
            data-invalid={Boolean(errors.shortDescription)}
          >
            <FieldLabel htmlFor="shortDescription">
              Short description
            </FieldLabel>
            <Textarea
              id="shortDescription"
              rows={4}
              aria-invalid={Boolean(errors.shortDescription)}
              {...register("shortDescription")}
            />
            <FieldDescription
              className={
                descriptionWords > MAX_CARD_WORDS ? "text-destructive" : ""
              }
            >
              {descriptionWords} / {MAX_CARD_WORDS} words — the card is sized
              for one tidy block.
            </FieldDescription>
            <FieldError>{errors.shortDescription?.message}</FieldError>
          </Field>
          <Field
            className="sm:col-span-2"
            data-invalid={Boolean(errors.contribution)}
          >
            <FieldLabel htmlFor="contribution">
              Contribution or outcome
            </FieldLabel>
            <Textarea
              id="contribution"
              rows={3}
              aria-invalid={Boolean(errors.contribution)}
              {...register("contribution")}
            />
            <FieldDescription>
              Optional evidence of your role or the result.
            </FieldDescription>
            <FieldError>{errors.contribution?.message}</FieldError>
          </Field>
          <FormTextField
            className="sm:col-span-2"
            label="URL"
            type="url"
            description="Where the card goes when clicked."
            error={errors.url?.message}
            inputProps={register("url")}
          />
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Presentation</FieldLegend>
        <FieldGroup className="grid gap-6 sm:grid-cols-2">
          <Controller
            control={control}
            name="iconName"
            render={({ field }) => (
              <Field
                className="sm:col-span-2"
                data-invalid={Boolean(errors.iconName)}
              >
                <FieldLabel htmlFor="project-icon">Icon source</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="project-icon"
                    className="w-full"
                    aria-invalid={Boolean(errors.iconName)}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {projectIconOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.icon
                            ? createElement(option.icon, {
                                "aria-hidden": true,
                              })
                            : null}
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  {
                    projectIconOptions.find((o) => o.value === field.value)
                      ?.hint
                  }
                </FieldDescription>
                <FieldError>{errors.iconName?.message}</FieldError>
              </Field>
            )}
          />
          {/* The upload and its alt text only matter for the uploaded option.
              Leaving them on screen for GitHub or Web invites filling in
              fields that would then never be rendered. */}
          {iconName === "custom" ? (
            <>
              <UploadField
                resourceType="icon"
                value={iconKey}
                onChange={(key) =>
                  setValue("iconKey", key, { shouldDirty: true })
                }
                error={errors.iconKey?.message}
              />
              <FormTextField
                label="Icon alt text"
                error={errors.iconAlt?.message}
                inputProps={register("iconAlt")}
              />
            </>
          ) : null}
          <FormTextField
            label="Homepage order"
            type="number"
            error={errors.homepageOrder?.message}
            inputProps={register("homepageOrder", { valueAsNumber: true })}
          />
          <FieldGroup>
            <Controller
              control={control}
              name="showOnHomepage"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <div className="flex-1">
                    <FieldLabel htmlFor="showOnHomepage">
                      Show on homepage
                    </FieldLabel>
                    <FieldDescription>
                      Counts toward the twelve-project homepage limit when
                      published.
                    </FieldDescription>
                  </div>
                  <Switch
                    id="showOnHomepage"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />
            <Controller
              control={control}
              name="published"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <div className="flex-1">
                    <FieldLabel htmlFor="published">Published</FieldLabel>
                    <FieldDescription>
                      Visible on the public portfolio.
                    </FieldDescription>
                  </div>
                  <Switch
                    id="published"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />
          </FieldGroup>
        </FieldGroup>
      </FieldSet>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle data-icon="inline-start" className="animate-spin" />
          ) : (
            <Save data-icon="inline-start" />
          )}
          {project ? "Save changes" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
