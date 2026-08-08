"use client";

import { createElement, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteRecognition,
  saveRecognition,
} from "@/app/admin/actions/recognitions";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { FormTextField } from "@/components/admin/form-text-field";
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
import { Button } from "@/components/ui/button";
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
  FieldError,
  FieldGroup,
  FieldLabel,
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
import {
  getRecognitionIcon,
  recognitionIconOptions,
} from "@/config/recognition-icons";
import type { Recognition } from "@/db/schema";
import { recognitionSchema, type RecognitionInput } from "@/lib/validation";

const emptyRecognition: RecognitionInput = {
  title: "",
  iconName: "trophy",
  displayOrder: 0,
  published: false,
};

export function RecognitionsManager({ items }: { items: Recognition[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Recognition>();

  function launch(item?: Recognition) {
    setEditing(item);
    setOpen(true);
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => launch()}>
          <Plus data-icon="inline-start" />
          Add recognition
        </Button>
      </div>
      {items.length ? (
        <ul className="divide-y border-y">
          {items.map((item) => {
            return (
              <li
                key={item.id}
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
              >
                <div className="flex min-w-0 items-start gap-3">
                  {createElement(getRecognitionIcon(item.iconName), {
                    className: "mt-0.5 size-4 shrink-0 text-muted-foreground",
                    "aria-hidden": true,
                  })}
                  <div className="min-w-0">
                    <h2 className="text-sm text-foreground">{item.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.published ? "Published" : "Draft"}
                      {item.verificationUrl
                        ? " / Linked evidence"
                        : " / Static recognition"}
                      {` / Order ${item.displayOrder}`}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4 text-sm">
                  <button
                    type="button"
                    onClick={() => launch(item)}
                    className="inline-flex min-h-11 items-center text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Edit
                  </button>
                  <DeleteRecognition item={item} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <AdminEmptyState
          title="No recognitions yet"
          description="Add concise awards, milestones, and evidence of impact."
        />
      )}
      <RecognitionDialog
        key={editing?.id ?? "new"}
        open={open}
        onOpenChange={setOpen}
        item={editing}
      />
    </>
  );
}

function RecognitionDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Recognition;
}) {
  const form = useForm<RecognitionInput>({
    resolver: zodResolver(recognitionSchema),
    defaultValues: item
      ? {
          title: item.title,
          iconName: item.iconName,
          verificationUrl: item.verificationUrl ?? undefined,
          displayOrder: item.displayOrder,
          published: item.published,
        }
      : emptyRecognition,
  });
  const {
    register,
    control,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  async function submit(values: RecognitionInput) {
    const result = await saveRecognition(values, item?.id);
    if (!result.ok) {
      Object.entries(result.fields ?? {}).forEach(([name, messages]) =>
        setError(name as keyof RecognitionInput, { message: messages[0] }),
      );
      toast.error(result.message);
      return;
    }

    toast.success(item ? "Recognition updated." : "Recognition created.");
    onOpenChange(false);
    window.location.reload();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {item ? "Edit recognition" : "Add recognition"}
          </DialogTitle>
          <DialogDescription>
            Add a concise recognition and an optional supporting link.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)}>
          <FieldGroup className="grid gap-5 sm:grid-cols-2">
            <FormTextField
              className="sm:col-span-2"
              label="Recognition"
              error={errors.title?.message}
              inputProps={register("title")}
            />
            <Controller
              control={control}
              name="iconName"
              render={({ field }) => (
                <Field data-invalid={Boolean(errors.iconName)}>
                  <FieldLabel htmlFor="recognition-icon">Icon</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="recognition-icon"
                      className="w-full"
                      aria-invalid={Boolean(errors.iconName)}
                    >
                      <SelectValue placeholder="Select an icon" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {recognitionIconOptions.map((option) => {
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              {createElement(option.icon, {
                                "aria-hidden": true,
                              })}
                              {option.label}
                            </SelectItem>
                          );
                        })}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError>{errors.iconName?.message}</FieldError>
                </Field>
              )}
            />
            <FormTextField
              label="Display order"
              type="number"
              error={errors.displayOrder?.message}
              inputProps={register("displayOrder", { valueAsNumber: true })}
            />
            <FormTextField
              className="sm:col-span-2"
              label="Supporting link (optional)"
              type="url"
              error={errors.verificationUrl?.message}
              inputProps={register("verificationUrl")}
            />
            <Controller
              control={control}
              name="published"
              render={({ field }) => (
                <Field orientation="horizontal" className="sm:col-span-2">
                  <FieldLabel
                    className="flex-1"
                    htmlFor="recognition-published"
                  >
                    Published
                  </FieldLabel>
                  <Switch
                    id="recognition-published"
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
              Save recognition
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteRecognition({ item }: { item: Recognition }) {
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteRecognition(item.id);
      if (result.ok) {
        toast.success("Recognition deleted.");
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
          aria-label={`Delete ${item.title}`}
        >
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{item.title}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the recognition row.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            variant="destructive"
            onClick={remove}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
