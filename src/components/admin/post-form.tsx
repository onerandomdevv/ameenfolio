"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deletePost, savePost } from "@/app/admin/actions/writing";
import {
  AdminPage,
  FieldNote,
  FieldRow,
  SectionHeading,
} from "@/components/admin/admin-primitives";
import { LeaveGuard } from "@/components/admin/leave-guard";
import { LineInput, LineSelect } from "@/components/admin/line-input";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { Button } from "@/components/ui/button";
import { postLinkIconOptions } from "@/config/post-link-icons";
import type { Post, PostLink } from "@/db/schema";
import { useAdminBase } from "@/lib/use-admin-base";
import { slugifyTitle } from "@/lib/writing/slug";
import { postSchema, type PostInput } from "@/lib/validation";

const MAX_LINKS = 6;

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
    publishedAt: new Date(),
    links: [],
  };
}

export function PostForm({ post, links }: { post?: Post; links?: PostLink[] }) {
  const router = useRouter();
  const base = useAdminBase();
  const [leaving, setLeaving] = useState(false);
  // Only for a post that has never been saved. Once an address is published,
  // people have it — so the slug stops following the title.
  const [slugFollowsTitle, setSlugFollowsTitle] = useState(!post);
  const live = Boolean(post?.published);

  const form = useForm<PostInput>({
    resolver: zodResolver(postSchema),
    defaultValues: post
      ? {
          title: post.title,
          slug: post.slug,
          bodyMarkdown: post.bodyMarkdown,
          publishedAt: post.publishedAt,
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
    getValues,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = form;

  const linkFields = useFieldArray({ control, name: "links" });
  const title = useWatch({ control, name: "title" }) ?? "";
  const body = useWatch({ control, name: "bodyMarkdown" }) ?? "";
  const hasContent = Boolean(title.trim() || body.trim());

  async function persist(values: PostInput, shouldPublish: boolean) {
    const result = await savePost(values, post?.id, shouldPublish);
    if (!result.ok) {
      Object.entries(result.fields ?? {}).forEach(([name, messages]) =>
        setError(name as keyof PostInput, { message: messages[0] }),
      );
      toast.error(result.message);
      return false;
    }
    return true;
  }

  async function publish(values: PostInput) {
    if (!(await persist(values, true))) return;
    toast.success(live ? "Post updated." : "Post published.");
    router.push(`${base}/writing`);
    router.refresh();
  }

  function cancel() {
    // Already on the site, or nothing written: leaving needs no decision.
    if (live || !hasContent) {
      router.push(`${base}/writing`);
      return;
    }
    setLeaving(true);
  }

  async function saveDraft() {
    if (!(await persist(getValues(), false))) return;
    setLeaving(false);
    toast.success("Saved as a draft.");
    router.push(`${base}/writing`);
    router.refresh();
  }

  async function discard() {
    setLeaving(false);
    if (post) await deletePost(post.id);
    router.push(`${base}/writing`);
    router.refresh();
  }

  return (
    <AdminPage
      title={post ? "Edit post" : "New post"}
      actions={
        <>
          <Button type="button" variant="ghost" onClick={cancel}>
            Cancel
          </Button>
          <Button type="submit" form="post-form" disabled={isSubmitting}>
            {isSubmitting ? (
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
            ) : null}
            Publish
          </Button>
        </>
      }
    >
      <form id="post-form" onSubmit={handleSubmit(publish)}>
        <div className="max-w-[720px]">
          <SectionHeading>Post</SectionHeading>
          <FieldRow label="Title" note={errors.title ? "required" : undefined}>
            <LineInput
              placeholder="What the post is called"
              invalid={Boolean(errors.title)}
              {...register("title", {
                onChange: (event) => {
                  if (!slugFollowsTitle) return;
                  setValue("slug", slugifyTitle(event.target.value), {
                    shouldValidate: true,
                  });
                },
              })}
            />
          </FieldRow>
          <FieldRow label="Address" note="changing this breaks existing links">
            <span className="flex items-center font-mono text-[12.5px] text-muted-foreground">
              /writing/
              <LineInput
                mono
                placeholder="address"
                invalid={Boolean(errors.slug)}
                {...register("slug", {
                  onChange: () => setSlugFollowsTitle(false),
                })}
              />
            </span>
          </FieldRow>
          <FieldRow label="Date" note="what the post is dated">
            <Controller
              control={control}
              name="publishedAt"
              render={({ field }) => (
                <LineInput
                  type="date"
                  mono
                  value={field.value ? toDateInput(new Date(field.value)) : ""}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value
                        ? new Date(`${event.target.value}T00:00:00Z`)
                        : field.value,
                    )
                  }
                />
              )}
            />
          </FieldRow>

          <SectionHeading className="mt-8" meta="Markdown">
            Body
          </SectionHeading>
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

          <SectionHeading
            className="mt-8"
            meta={
              <span className="font-mono tabular-nums">
                {linkFields.fields.length} / {MAX_LINKS}
              </span>
            }
            action={
              linkFields.fields.length < MAX_LINKS ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    linkFields.append({
                      label: "",
                      url: "https://",
                      iconName: "link",
                      displayOrder: linkFields.fields.length,
                    })
                  }
                >
                  <Plus data-icon="inline-start" />
                  Add link
                </Button>
              ) : null
            }
          >
            Links
          </SectionHeading>
          <FieldNote>Shown at the end of the post.</FieldNote>
          {linkFields.fields.map((row, index) => (
            <div
              key={row.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border/60 py-2.5"
            >
              <Controller
                control={control}
                name={`links.${index}.iconName`}
                render={({ field }) => (
                  <span className="w-[7.5rem] shrink-0">
                    <LineSelect value={field.value} onChange={field.onChange}>
                      {postLinkIconOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </LineSelect>
                  </span>
                )}
              />
              <span className="w-[9rem] shrink-0">
                <LineInput
                  placeholder="Label"
                  invalid={Boolean(errors.links?.[index]?.label)}
                  {...register(`links.${index}.label`)}
                />
              </span>
              <span className="min-w-0 flex-1 basis-[12rem]">
                <LineInput
                  mono
                  placeholder="https://"
                  invalid={Boolean(errors.links?.[index]?.url)}
                  {...register(`links.${index}.url`)}
                />
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Remove link ${index + 1}`}
                onClick={() => linkFields.remove(index)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          ))}

          <FieldNote>
            {live
              ? "Pin it from the writing list to show it on the homepage."
              : "Publishing puts this on the site. Pin it from the writing list afterwards to show it on the homepage."}
          </FieldNote>
        </div>
      </form>

      <LeaveGuard
        open={leaving}
        noun="post"
        onOpenChange={setLeaving}
        onDiscard={discard}
        onSaveDraft={saveDraft}
        saving={isSubmitting}
      />
    </AdminPage>
  );
}
