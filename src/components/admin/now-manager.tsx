"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form";
import { LoaderCircle, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteNowLink,
  saveNowLink,
  saveNowSection,
} from "@/app/admin/actions/now";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { FormTextField } from "@/components/admin/form-text-field";
import { UploadField } from "@/components/admin/upload-field";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { NowLink, NowSection } from "@/db/schema";
import { MAX_NOW_LINKS } from "@/lib/ordering";
import { cleanupUpload } from "@/lib/storage/cleanup-upload";
import {
  nowLinkSchema,
  nowSectionSchema,
  type NowLinkInput,
  type NowSectionInput,
} from "@/lib/validation";

const emptyLink: NowLinkInput = {
  label: "",
  url: "",
  displayOrder: 0,
  visible: true,
};

export function NowManager({
  section,
  links,
}: {
  section: NowSection;
  links: NowLink[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NowLink>();
  const atLimit = links.length >= MAX_NOW_LINKS;

  function launch(item?: NowLink) {
    setEditing(item);
    setOpen(true);
  }

  return (
    <div className="flex flex-col gap-8">
      <NowSectionForm section={section} />

      <section aria-labelledby="now-links-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="now-links-heading" className="text-lg font-semibold">
              Linked items
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add up to {MAX_NOW_LINKS} current projects, learning topics, or
              contributions.
            </p>
          </div>
          <Button onClick={() => launch()} disabled={atLimit}>
            <Plus data-icon="inline-start" />
            Add link
          </Button>
        </div>

        {atLimit ? (
          <p className="mb-4 text-sm text-muted-foreground">
            Maximum of {MAX_NOW_LINKS} links reached.
          </p>
        ) : null}

        {links.length ? (
          <div className="grid gap-3">
            {links.map((item) => (
              <Card key={item.id} className="gap-3">
                <CardHeader>
                  <CardTitle>
                    <h3>{item.label}</h3>
                  </CardTitle>
                  <CardDescription className="truncate">
                    {item.url}
                  </CardDescription>
                  <CardAction className="flex items-center gap-1">
                    <Badge variant={item.visible ? "default" : "secondary"}>
                      {item.visible ? "Visible" : "Hidden"}
                    </Badge>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => launch(item)}
                      aria-label={`Edit ${item.label}`}
                    >
                      <Pencil />
                    </Button>
                    <DeleteNowLink item={item} />
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Display order: {item.displayOrder}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <AdminEmptyState
            title="No linked items yet"
            description="The Now section can be published with only its description."
          />
        )}
      </section>

      <NowLinkDialog
        key={editing?.id ?? "new"}
        open={open}
        onOpenChange={setOpen}
        item={editing}
      />
    </div>
  );
}

function NowSectionForm({ section }: { section: NowSection }) {
  const form = useForm<NowSectionInput>({
    resolver: zodResolver(nowSectionSchema),
    defaultValues: {
      description: section.description,
      published: section.published,
      showLastUpdated: section.showLastUpdated,
    },
  });
  const {
    register,
    control,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  async function submit(values: NowSectionInput) {
    const result = await saveNowSection(values);
    if (!result.ok) {
      Object.entries(result.fields ?? {}).forEach(([name, messages]) =>
        setError(name as FieldPath<NowSectionInput>, { message: messages[0] }),
      );
      toast.error(result.message);
      return;
    }

    toast.success("Now section saved.");
    window.location.reload();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current focus</CardTitle>
        <CardDescription>
          This copy appears below the fixed “Now” heading on the homepage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="now-section-form" onSubmit={handleSubmit(submit)}>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.description)}>
              <FieldLabel htmlFor="now-description">Description</FieldLabel>
              <Textarea
                id="now-description"
                rows={5}
                aria-invalid={Boolean(errors.description)}
                {...register("description")}
              />
              <FieldDescription>
                A short update about what has your attention right now.
              </FieldDescription>
              <FieldError>{errors.description?.message}</FieldError>
            </Field>
            <FieldSet>
              <FieldLegend variant="label">Publishing</FieldLegend>
              <FieldGroup className="gap-4">
                <Controller
                  control={control}
                  name="published"
                  render={({ field }) => (
                    <Field orientation="horizontal">
                      <FieldLabel htmlFor="now-published">Published</FieldLabel>
                      <Switch
                        id="now-published"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name="showLastUpdated"
                  render={({ field }) => (
                    <Field orientation="horizontal">
                      <FieldLabel htmlFor="now-last-updated">
                        Show last updated date
                      </FieldLabel>
                      <Switch
                        id="now-last-updated"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </Field>
                  )}
                />
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Button type="submit" form="now-section-form" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle data-icon="inline-start" className="animate-spin" />
          ) : (
            <Save data-icon="inline-start" />
          )}
          {isSubmitting ? "Saving…" : "Save Now section"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function NowLinkDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: NowLink;
}) {
  const form = useForm<NowLinkInput>({
    resolver: zodResolver(nowLinkSchema),
    defaultValues: item
      ? {
          label: item.label,
          url: item.url,
          iconKey: item.iconKey ?? undefined,
          iconAlt: item.iconAlt ?? undefined,
          displayOrder: item.displayOrder,
          visible: item.visible,
        }
      : emptyLink,
  });
  const {
    register,
    control,
    setValue,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;
  const iconKey = useWatch({ control, name: "iconKey" });

  async function submit(values: NowLinkInput) {
    const result = await saveNowLink(values, item?.id);
    if (!result.ok) {
      if (values.iconKey && values.iconKey !== item?.iconKey) {
        await cleanupUpload(values.iconKey);
        setValue("iconKey", undefined);
      }
      Object.entries(result.fields ?? {}).forEach(([name, messages]) =>
        setError(name as FieldPath<NowLinkInput>, { message: messages[0] }),
      );
      toast.error(result.message);
      return;
    }

    toast.success(item ? "Now link updated." : "Now link created.");
    onOpenChange(false);
    window.location.reload();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Now link" : "Add Now link"}</DialogTitle>
          <DialogDescription>
            Link to something you are currently building, learning, or
            contributing to.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)}>
          <FieldGroup className="grid gap-5 sm:grid-cols-2">
            <FormTextField
              label="Label"
              error={errors.label?.message}
              inputProps={register("label")}
            />
            <FormTextField
              label="Display order"
              type="number"
              error={errors.displayOrder?.message}
              inputProps={register("displayOrder", { valueAsNumber: true })}
            />
            <FormTextField
              className="sm:col-span-2"
              label="HTTPS URL"
              type="url"
              error={errors.url?.message}
              inputProps={register("url")}
            />
            <UploadField
              resourceType="icon"
              value={iconKey}
              error={errors.iconKey?.message}
              onChange={(key) => setValue("iconKey", key)}
            />
            <FormTextField
              label="Icon alt text"
              error={errors.iconAlt?.message}
              inputProps={register("iconAlt")}
            />
            <Controller
              control={control}
              name="visible"
              render={({ field }) => (
                <Field orientation="horizontal" className="sm:col-span-2">
                  <FieldLabel htmlFor="now-link-visible">Visible</FieldLabel>
                  <Switch
                    id="now-link-visible"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <LoaderCircle
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : null}
              {isSubmitting ? "Saving…" : "Save link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteNowLink({ item }: { item: NowLink }) {
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteNowLink(item.id);
      if (result.ok) {
        toast.success("Now link deleted.");
        window.location.reload();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={`Delete ${item.label}`}
        >
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{item.label}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the link and its managed icon.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            variant="destructive"
            onClick={remove}
          >
            {pending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
