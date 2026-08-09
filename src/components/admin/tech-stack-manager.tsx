"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteTechStackItem,
  saveTechStackItem,
} from "@/app/admin/actions/tech-stack";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminSection } from "@/components/admin/admin-section";
import { FormTextField } from "@/components/admin/form-text-field";
import { AdminPageHeader } from "@/components/admin/page-header";
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
import { techStackGroups } from "@/config/tech-stack";
import type { TechStackItem } from "@/db/schema";
import { techStackItemSchema, type TechStackItemInput } from "@/lib/validation";

const emptyItem: TechStackItemInput = {
  name: "",
  groupKey: "core",
  displayOrder: 0,
  visible: true,
};

export function TechStackManager({ items }: { items: TechStackItem[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TechStackItem>();

  function launch(item?: TechStackItem) {
    setEditing(item);
    setOpen(true);
  }

  return (
    <>
      <AdminPageHeader
        title="Tech Stack"
        description="Technologies listed on the homepage, grouped into Core Stack and Tools & Infrastructure."
        action={
          <Button size="sm" onClick={() => launch()}>
            <Plus data-icon="inline-start" />
            Add technology
          </Button>
        }
      />

      {items.length ? (
        // Grouped in the admin the same way it renders publicly, so the effect
        // of the group field is visible without leaving the page.
        <div className="grid gap-6">
          {techStackGroups.map((group) => {
            const groupItems = items.filter(
              (item) => item.groupKey === group.value,
            );

            return (
              <AdminSection
                key={group.value}
                title={group.label}
                description={`${groupItems.length} ${groupItems.length === 1 ? "technology" : "technologies"}`}
              >
                {groupItems.length ? (
                  <ul className="flex flex-wrap gap-2">
                    {groupItems.map((item) => (
                      <li key={item.id}>
                        <div className="flex items-center gap-1 rounded-md border border-border bg-background py-1 pl-3 pr-1">
                          <button
                            type="button"
                            onClick={() => launch(item)}
                            className="text-sm text-foreground underline-offset-4 hover:underline"
                          >
                            {item.name}
                          </button>
                          {!item.visible ? (
                            <Badge variant="outline" className="ml-1">
                              Hidden
                            </Badge>
                          ) : null}
                          <DeleteTechStackItem item={item} />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nothing here yet. The group is hidden on the homepage until
                    it has an entry.
                  </p>
                )}
              </AdminSection>
            );
          })}
        </div>
      ) : (
        <AdminEmptyState
          title="No technologies yet"
          description="Add the tools and languages you want listed on the homepage."
        />
      )}

      <TechStackDialog
        key={editing?.id ?? "new"}
        open={open}
        onOpenChange={setOpen}
        item={editing}
      />
    </>
  );
}

function DeleteTechStackItem({ item }: { item: TechStackItem }) {
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteTechStackItem(item.id);
      if (result.ok) {
        toast.success("Technology removed.");
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
          size="icon-xs"
          variant="ghost"
          aria-label={`Delete ${item.name}`}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove “{item.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            It disappears from the homepage tech stack immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            variant="destructive"
            onClick={remove}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function TechStackDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: TechStackItem;
}) {
  const form = useForm<TechStackItemInput>({
    resolver: zodResolver(techStackItemSchema),
    defaultValues: item
      ? {
          name: item.name,
          groupKey: item.groupKey,
          displayOrder: item.displayOrder,
          visible: item.visible,
        }
      : emptyItem,
  });
  const {
    register,
    control,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  async function submit(values: TechStackItemInput) {
    const result = await saveTechStackItem(values, item?.id);
    if (!result.ok) {
      Object.entries(result.fields ?? {}).forEach(([name, messages]) =>
        setError(name as keyof TechStackItemInput, { message: messages[0] }),
      );
      toast.error(result.message);
      return;
    }

    toast.success(item ? "Technology updated." : "Technology added.");
    onOpenChange(false);
    window.location.reload();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {item ? "Edit technology" : "Add technology"}
          </DialogTitle>
          <DialogDescription>
            Choose the group it belongs to and where it sits in the list.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)}>
          <FieldGroup className="grid gap-5 sm:grid-cols-2">
            <FormTextField
              className="sm:col-span-2"
              label="Name"
              error={errors.name?.message}
              inputProps={register("name")}
            />
            <Controller
              control={control}
              name="groupKey"
              render={({ field }) => (
                <Field data-invalid={Boolean(errors.groupKey)}>
                  <FieldLabel htmlFor="tech-group">Group</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="tech-group"
                      className="w-full"
                      aria-invalid={Boolean(errors.groupKey)}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {techStackGroups.map((group) => (
                          <SelectItem key={group.value} value={group.value}>
                            {group.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError>{errors.groupKey?.message}</FieldError>
                </Field>
              )}
            />
            <FormTextField
              label="Order"
              type="number"
              error={errors.displayOrder?.message}
              inputProps={register("displayOrder", { valueAsNumber: true })}
            />
            <Controller
              control={control}
              name="visible"
              render={({ field }) => (
                <Field
                  orientation="horizontal"
                  className="sm:col-span-2"
                  data-invalid={Boolean(errors.visible)}
                >
                  <FieldLabel htmlFor="tech-visible">
                    Show on the homepage
                  </FieldLabel>
                  <Switch
                    id="tech-visible"
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
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
