"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteRecognition,
  saveRecognition,
} from "@/app/admin/actions/recognitions";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Recognition } from "@/db/schema";
import { cleanupUpload } from "@/lib/storage/cleanup-upload";
import { recognitionSchema, type RecognitionInput } from "@/lib/validation";

const emptyRecognition: RecognitionInput = {
  title: "",
  issuer: "",
  description: "",
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
        <div className="grid gap-3">
          {items.map((item) => (
            <Card key={item.id} className="gap-3">
              <CardHeader>
                <CardTitle>
                  <h2>{item.title}</h2>
                </CardTitle>
                <CardDescription>{item.issuer}</CardDescription>
                <CardAction className="flex items-center gap-1">
                  <Badge variant={item.published ? "default" : "secondary"}>
                    {item.published ? "Published" : "Draft"}
                  </Badge>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => launch(item)}
                    aria-label={`Edit ${item.title}`}
                  >
                    <Pencil />
                  </Button>
                  <DeleteRecognition item={item} />
                </CardAction>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <AdminEmptyState
          title="No recognitions yet"
          description="Add awards, mentions, and other evidence of your work."
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
          issuer: item.issuer,
          description: item.description,
          recognizedOn: item.recognizedOn ?? undefined,
          verificationUrl: item.verificationUrl ?? undefined,
          iconKey: item.iconKey ?? undefined,
          iconAlt: item.iconAlt ?? undefined,
          displayOrder: item.displayOrder,
          published: item.published,
        }
      : emptyRecognition,
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

  async function submit(values: RecognitionInput) {
    const result = await saveRecognition(values, item?.id);
    if (!result.ok) {
      if (values.iconKey && values.iconKey !== item?.iconKey) {
        await cleanupUpload(values.iconKey);
        setValue("iconKey", undefined);
      }
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
            Capture the issuer, evidence, and display order.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)}>
          <FieldGroup className="grid gap-5 sm:grid-cols-2">
            <FormTextField
              label="Title"
              error={errors.title?.message}
              inputProps={register("title")}
            />
            <FormTextField
              label="Issuer"
              error={errors.issuer?.message}
              inputProps={register("issuer")}
            />
            <Field
              className="sm:col-span-2"
              data-invalid={Boolean(errors.description)}
            >
              <FieldLabel htmlFor="recognition-description">
                Description
              </FieldLabel>
              <Textarea
                id="recognition-description"
                rows={4}
                aria-invalid={Boolean(errors.description)}
                {...register("description")}
              />
              <FieldError>{errors.description?.message}</FieldError>
            </Field>
            <FormTextField
              label="Date"
              type="date"
              error={errors.recognizedOn?.message}
              inputProps={register("recognizedOn")}
            />
            <FormTextField
              label="Display order"
              type="number"
              error={errors.displayOrder?.message}
              inputProps={register("displayOrder", { valueAsNumber: true })}
            />
            <FormTextField
              className="sm:col-span-2"
              label="Verification URL"
              type="url"
              error={errors.verificationUrl?.message}
              inputProps={register("verificationUrl")}
            />
            <UploadField
              resourceType="icon"
              value={iconKey}
              onChange={(key) => setValue("iconKey", key)}
            />
            <FormTextField
              label="Icon alt text"
              error={errors.iconAlt?.message}
              inputProps={register("iconAlt")}
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
            This permanently removes the recognition and its managed icon.
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
