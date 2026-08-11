"use client";

import { createElement, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { savePost } from "@/app/admin/actions/writing";
import { FormTextField } from "@/components/admin/form-text-field";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
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
import { postLinkIconOptions } from "@/config/post-link-icons";
import type { Post, PostCategory, PostLink } from "@/db/schema";
import { useAdminBase } from "@/lib/use-admin-base";
import { slugifyTitle } from "@/lib/writing/slug";
import { MAX_PINNED_POSTS } from "@/lib/ordering";
import { postSchema, type PostInput } from "@/lib/validation";

const UNCATEGORISED = "none";

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

// A function rather than a constant: a module-level `new Date()` is fixed at
// import time, so in a long-lived admin session a new post would open dated to
// whenever the tab was first loaded.
function emptyPost(): PostInput {
  return {
    title: "",
    slug: "",
    bodyMarkdown: "",
    categoryId: null,
    publishedAt: new Date(),
    published: false,
    pinned: false,
    pinnedOrder: 0,
    links: [],
  };
}

export function PostForm({
  post,
  links,
  categories,
}: {
  post?: Post;
  links?: PostLink[];
  categories: PostCategory[];
}) {
  const router = useRouter();
  const base = useAdminBase();
  // Only for a post that has never been saved. Once an address is published,
  // people have it — so the slug stops following the title and has to be
  // changed on purpose.
  const [slugFollowsTitle, setSlugFollowsTitle] = useState(!post);

  const form = useForm<PostInput>({
    resolver: zodResolver(postSchema),
    defaultValues: post
      ? {
          title: post.title,
          slug: post.slug,
          bodyMarkdown: post.bodyMarkdown,
          categoryId: post.categoryId,
          publishedAt: post.publishedAt,
          published: post.published,
          pinned: post.pinned,
          pinnedOrder: post.pinnedOrder,
          links: (links ?? []).map((link) => ({
            label: link.label,
            url: link.url,
            iconName: link.iconName,
            displayOrder: link.displayOrder,
          })),
        }
      : emptyPost(),
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = form;

  const linkFields = useFieldArray({ control, name: "links" });

  async function submit(values: PostInput) {
    const result = await savePost(values, post?.id);
    if (!result.ok) {
      Object.entries(result.fields ?? {}).forEach(([name, messages]) =>
        setError(name as keyof PostInput, { message: messages[0] }),
      );
      toast.error(result.message);
      return;
    }

    toast.success(post ? "Post updated." : "Post created.");
    router.push(`${base}/writing`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-8">
      <FieldSet>
        <FieldLegend>Post</FieldLegend>
        <FieldGroup className="grid gap-6 sm:grid-cols-2">
          <FormTextField
            label="Title"
            className="sm:col-span-2"
            error={errors.title?.message}
            inputProps={register("title", {
              onChange: (event) => {
                if (!slugFollowsTitle) return;
                setValue("slug", slugifyTitle(event.target.value), {
                  shouldValidate: true,
                });
              },
            })}
          />
          <FormTextField
            label="Address"
            className="sm:col-span-2"
            description="The last part of the post's URL. Changing it after publishing breaks existing links."
            error={errors.slug?.message}
            inputProps={register("slug", {
              onChange: () => setSlugFollowsTitle(false),
            })}
          />

          <Field data-invalid={Boolean(errors.publishedAt)}>
            <FieldLabel htmlFor="publishedAt">Date</FieldLabel>
            <Controller
              control={control}
              name="publishedAt"
              render={({ field }) => (
                <input
                  id="publishedAt"
                  type="date"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  value={field.value ? toDateInput(new Date(field.value)) : ""}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value
                        ? new Date(`${event.target.value}T00:00:00Z`)
                        : null,
                    )
                  }
                />
              )}
            />
            <FieldDescription>
              What the post is dated, which need not be today.
            </FieldDescription>
            {errors.publishedAt ? (
              <FieldError>{errors.publishedAt.message}</FieldError>
            ) : null}
          </Field>

          <Field data-invalid={Boolean(errors.categoryId)}>
            <FieldLabel htmlFor="categoryId">Category</FieldLabel>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select
                  value={field.value ?? UNCATEGORISED}
                  onValueChange={(value) =>
                    field.onChange(value === UNCATEGORISED ? null : value)
                  }
                >
                  <SelectTrigger id="categoryId">
                    <SelectValue placeholder="Uncategorised" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value={UNCATEGORISED}>
                        Uncategorised
                      </SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldDescription>
              Groups the post on the writing page. Optional.
            </FieldDescription>
          </Field>

          <Field className="sm:col-span-2">
            <Controller
              control={control}
              name="bodyMarkdown"
              render={({ field }) => (
                <MarkdownEditor
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  error={errors.bodyMarkdown?.message}
                />
              )}
            />
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Links</FieldLegend>
        <FieldDescription>
          Shown at the end of the post — where it continues, or what it is
          about. Up to six.
        </FieldDescription>
        <FieldGroup className="grid gap-4">
          {linkFields.fields.map((row, index) => (
            <div
              key={row.id}
              className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[10rem_1fr_auto]"
            >
              <Controller
                control={control}
                name={`links.${index}.iconName`}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Icon">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {postLinkIconOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <span className="flex items-center gap-2">
                              {createElement(option.icon, {
                                className: "size-3.5",
                                "aria-hidden": true,
                              })}
                              {option.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <div className="grid gap-3">
                <FormTextField
                  label="Label"
                  error={errors.links?.[index]?.label?.message}
                  inputProps={register(`links.${index}.label`)}
                />
                <FormTextField
                  label="URL"
                  error={errors.links?.[index]?.url?.message}
                  inputProps={register(`links.${index}.url`)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove link ${index + 1}`}
                onClick={() => linkFields.remove(index)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          ))}
          {linkFields.fields.length < 6 ? (
            <Button
              type="button"
              variant="outline"
              className="justify-self-start"
              onClick={() =>
                linkFields.append({
                  label: "",
                  url: "https://",
                  iconName: "link",
                  displayOrder: linkFields.fields.length,
                })
              }
            >
              <Plus aria-hidden="true" />
              Add link
            </Button>
          ) : null}
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Visibility</FieldLegend>
        <FieldGroup className="grid gap-6 sm:grid-cols-2">
          <Controller
            control={control}
            name="published"
            render={({ field }) => (
              <Field orientation="horizontal">
                <div className="grid gap-1">
                  <FieldLabel htmlFor="published">Published</FieldLabel>
                  <FieldDescription>
                    Drafts stay off the site entirely.
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
          <Controller
            control={control}
            name="pinned"
            render={({ field }) => (
              <Field orientation="horizontal">
                <div className="grid gap-1">
                  <FieldLabel htmlFor="pinned">Pin to homepage</FieldLabel>
                  <FieldDescription>
                    Up to {MAX_PINNED_POSTS} published posts, in the order
                    below.
                  </FieldDescription>
                </div>
                <Switch
                  id="pinned"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </Field>
            )}
          />
          <FormTextField
            label="Pin order"
            type="number"
            description="Lower numbers come first on the homepage."
            error={errors.pinnedOrder?.message}
            inputProps={register("pinnedOrder", { valueAsNumber: true })}
          />
        </FieldGroup>
      </FieldSet>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Save aria-hidden="true" />
          )}
          {post ? "Save post" : "Create post"}
        </Button>
        {post ? (
          <a
            href={`/writing/${post.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            View post
          </a>
        ) : null}
      </div>
    </form>
  );
}
