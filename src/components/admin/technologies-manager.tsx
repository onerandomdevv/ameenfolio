"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteTechnology,
  saveTechnology,
} from "@/app/admin/actions/technologies";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import type { Technology } from "@/db/schema";
import { cleanupUpload } from "@/lib/storage/cleanup-upload";
import { technologySchema, type TechnologyInput } from "@/lib/validation";

const emptyTechnology: TechnologyInput = {
  name: "",
  category: "",
  displayOrder: 0,
  visible: true,
};

export function TechnologiesManager({ items }: { items: Technology[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Technology>();

  function launch(item?: Technology) {
    setEditing(item);
    setOpen(true);
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => launch()}>
          <Plus data-icon="inline-start" />
          Add technology
        </Button>
      </div>
      {items.length ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <Card key={item.id} className="gap-0">
              <CardHeader>
                <CardTitle>
                  <h2>{item.name}</h2>
                </CardTitle>
                <CardDescription>
                  {item.category} · Order {item.displayOrder}
                </CardDescription>
                <CardAction className="flex items-center gap-1">
                  <Badge variant={item.visible ? "default" : "secondary"}>
                    {item.visible ? "Visible" : "Hidden"}
                  </Badge>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => launch(item)}
                    aria-label={`Edit ${item.name}`}
                  >
                    <Pencil />
                  </Button>
                  <DeleteTechnology item={item} />
                </CardAction>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <AdminEmptyState
          title="No technologies yet"
          description="Add the technologies that should appear on the portfolio."
        />
      )}
      <TechnologyDialog
        key={editing?.id ?? "new"}
        open={open}
        onOpenChange={setOpen}
        item={editing}
      />
    </>
  );
}

function TechnologyDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Technology;
}) {
  const form = useForm<TechnologyInput>({
    resolver: zodResolver(technologySchema),
    defaultValues: item
      ? {
          name: item.name,
          category: item.category,
          websiteUrl: item.websiteUrl ?? undefined,
          iconKey: item.iconKey ?? undefined,
          iconAlt: item.iconAlt ?? undefined,
          displayOrder: item.displayOrder,
          visible: item.visible,
        }
      : emptyTechnology,
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

  async function submit(values: TechnologyInput) {
    const result = await saveTechnology(values, item?.id);
    if (!result.ok) {
      if (values.iconKey && values.iconKey !== item?.iconKey) {
        await cleanupUpload(values.iconKey);
        setValue("iconKey", undefined);
      }
      Object.entries(result.fields ?? {}).forEach(([name, messages]) =>
        setError(name as keyof TechnologyInput, { message: messages[0] }),
      );
      toast.error(result.message);
      return;
    }

    toast.success(item ? "Technology updated." : "Technology created.");
    onOpenChange(false);
    window.location.reload();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {item ? "Edit technology" : "Add technology"}
          </DialogTitle>
          <DialogDescription>
            Technologies are grouped by category on the public site.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)}>
          <FieldGroup className="grid gap-5 sm:grid-cols-2">
            <FormTextField
              label="Name"
              error={errors.name?.message}
              inputProps={register("name")}
            />
            <FormTextField
              label="Category"
              error={errors.category?.message}
              inputProps={register("category")}
            />
            <FormTextField
              label="Website URL"
              type="url"
              error={errors.websiteUrl?.message}
              inputProps={register("websiteUrl")}
            />
            <FormTextField
              label="Display order"
              type="number"
              error={errors.displayOrder?.message}
              inputProps={register("displayOrder", { valueAsNumber: true })}
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
              name="visible"
              render={({ field }) => (
                <Field orientation="horizontal" className="sm:col-span-2">
                  <FieldLabel className="flex-1" htmlFor="technology-visible">
                    Visible
                  </FieldLabel>
                  <Switch
                    id="technology-visible"
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
              Save technology
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteTechnology({ item }: { item: Technology }) {
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteTechnology(item.id);
      if (result.ok) {
        toast.success("Technology deleted.");
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
          aria-label={`Delete ${item.name}`}
        >
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{item.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the technology and its managed icon.
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
