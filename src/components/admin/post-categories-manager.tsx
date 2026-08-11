"use client";

import { useEffect, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deletePostCategory,
  savePostCategory,
} from "@/app/admin/actions/writing";
import { AdminSection } from "@/components/admin/admin-section";
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
import { FieldGroup } from "@/components/ui/field";
import type { PostCategory } from "@/db/schema";
import { postCategorySchema, type PostCategoryInput } from "@/lib/validation";

// Names are rows rather than code, so they can be renamed without a deploy.
export function PostCategoriesManager({
  categories,
}: {
  categories: PostCategory[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PostCategory>();
  const [pending, startTransition] = useTransition();

  const form = useForm<PostCategoryInput>({
    resolver: zodResolver(postCategorySchema),
    defaultValues: { name: "", displayOrder: 0 },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      editing
        ? { name: editing.name, displayOrder: editing.displayOrder }
        : { name: "", displayOrder: categories.length },
    );
  }, [open, editing, categories.length, form]);

  function launch(category?: PostCategory) {
    setEditing(category);
    setOpen(true);
  }

  async function submit(values: PostCategoryInput) {
    const result = await savePostCategory(values, editing?.id);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(editing ? "Category renamed." : "Category added.");
    setOpen(false);
  }

  function remove(category: PostCategory) {
    startTransition(async () => {
      const result = await deletePostCategory(category.id);
      toast[result.ok ? "success" : "error"](
        result.ok ? "Category deleted." : result.message,
      );
    });
  }

  return (
    <AdminSection
      title="Categories"
      description="How writing is grouped on the public page. Rename them whenever you like — posts keep their place."
      action={
        <Button variant="outline" size="sm" onClick={() => launch()}>
          <Plus aria-hidden="true" />
          Add category
        </Button>
      }
    >
      {categories.length ? (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between gap-4 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">
                  {category.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Order {category.displayOrder}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Rename ${category.name}`}
                  onClick={() => launch(category)}
                >
                  <Pencil aria-hidden="true" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      aria-label={`Delete ${category.name}`}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete {category.name}?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Posts filed under it stay published and move to Other.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove(category)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No categories yet. Posts without one are grouped under Other.
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={form.handleSubmit(submit)}>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Rename category" : "Add category"}
              </DialogTitle>
              <DialogDescription>
                The name shown above a group of posts.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="grid gap-4 py-4">
              <FormTextField
                label="Name"
                error={form.formState.errors.name?.message}
                inputProps={form.register("name")}
              />
              <FormTextField
                label="Order"
                description="Lower numbers appear first."
                error={form.formState.errors.displayOrder?.message}
                inputProps={form.register("displayOrder", {
                  valueAsNumber: true,
                })}
              />
            </FieldGroup>
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminSection>
  );
}
