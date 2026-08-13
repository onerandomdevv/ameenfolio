import "server-only";

import { tool, type RunContext, type Tool } from "@openai/agents";
import { z } from "zod";
import { saveProject } from "@/app/admin/actions/projects";
import { saveRecognition } from "@/app/admin/actions/recognitions";
import { savePost } from "@/app/admin/actions/writing";
import {
  getAdminNow,
  getAdminPost,
  getAdminPosts,
  getAdminProject,
  getAdminProjects,
  getAdminRecognitions,
  getAdminSettings,
  getTakenSlugs,
} from "@/db/queries";
import { getAuthorizedAdmin } from "@/lib/auth/server";
import { createApproval, recordToolCall } from "@/lib/ai/repository";
import {
  listAssistantMemories,
  memoryCategories,
  rememberAssistantMemory,
} from "@/lib/ai/memory";
import type {
  AssistantApprovalView,
  AssistantToolCallView,
} from "@/lib/ai/types";
import { slugifyTitle, uniqueSlug } from "@/lib/writing/slug";
import {
  nowSectionSchema,
  projectSchema,
  recognitionSchema,
  seoSchema,
} from "@/lib/validation";
import { postLinkIconValues } from "@/config/post-link-icons";
import { projectIconValues } from "@/config/project-icons";
import { recognitionIconNames } from "@/config/recognition-icons";

export type PortfolioAgentContext = {
  threadId: string;
  runId: string;
  approvals: AssistantApprovalView[];
  onToolChange?: (call: AssistantToolCallView) => void;
};

const contentKind = z.enum(["project", "post", "recognition"]);

function contextOf(context?: RunContext<PortfolioAgentContext>) {
  if (!context?.context) throw new Error("Missing portfolio tool context.");
  return context.context;
}

async function requireAuthorizedToolCall() {
  if (!(await getAuthorizedAdmin())) {
    throw new Error("Administrator authorization is required.");
  }
}

async function audited<T>(
  context: RunContext<PortfolioAgentContext> | undefined,
  toolName: string,
  args: Record<string, unknown>,
  execute: () => Promise<T>,
) {
  await requireAuthorizedToolCall();
  const owner = contextOf(context);
  const { result } = await recordToolCall({
    threadId: owner.threadId,
    runId: owner.runId,
    toolName,
    arguments: args,
    onChange: owner.onToolChange,
    execute,
  });
  return result as T;
}

async function proposed(
  context: RunContext<PortfolioAgentContext> | undefined,
  toolName: string,
  actionType: string,
  payload: Record<string, unknown>,
  preview: Record<string, unknown>,
) {
  await requireAuthorizedToolCall();
  const owner = contextOf(context);
  const { result } = await recordToolCall({
    threadId: owner.threadId,
    runId: owner.runId,
    toolName,
    arguments: payload,
    requiresApproval: true,
    onChange: owner.onToolChange,
    execute: async (call) => {
      const approval = await createApproval({
        threadId: owner.threadId,
        runId: owner.runId,
        toolCallId: call.id,
        actionType,
        payload,
        preview,
      });
      owner.approvals.push(approval);
      return {
        approvalId: approval.id,
        status: "pending",
        message: "The administrator must approve this change.",
      };
    },
  });
  return result;
}

async function describeContent(kind: z.infer<typeof contentKind>, id: string) {
  if (kind === "project") return getAdminProject(id);
  if (kind === "post") return getAdminPost(id);
  return (await getAdminRecognitions()).find((item) => item.id === id) ?? null;
}

function contentTitle(
  item: NonNullable<Awaited<ReturnType<typeof describeContent>>>,
) {
  return "post" in item ? item.post.title : item.title;
}

function actionResult(result: { ok: boolean; id?: string; message?: string }) {
  if (!result.ok) throw new Error(result.message || "The action failed.");
  return { id: result.id, status: "draft_created" };
}

const postLinkSchema = z.object({
  label: z.string().trim().min(1).max(80),
  url: z.url().startsWith("https://"),
  iconName: z.enum(postLinkIconValues),
  displayOrder: z.number().int().min(0).max(999),
});

// Agent tool schemas avoid optional object properties. The Responses API's
// strict function schemas require every property to be present; nullable keeps
// the same meaning without making a valid tool definition ambiguous.
const agentProjectSchema = z.object({
  title: z.string().trim().min(2).max(120),
  shortDescription: z.string().trim().min(10).max(500),
  contribution: z.string().trim().max(500).nullable(),
  statusLabel: z.string().trim().max(60).nullable(),
  url: z.url().startsWith("https://"),
  iconKey: z
    .string()
    .regex(/^icons\/\d{4}\/[a-f0-9]{48}\.(png|jpg|webp)$/)
    .nullable(),
  iconAlt: z.string().trim().max(180).nullable(),
  iconName: z.enum(projectIconValues),
});

const agentRecognitionSchema = z.object({
  title: z.string().trim().min(2).max(180),
  iconName: z.enum(recognitionIconNames),
  verificationUrl: z.url().startsWith("https://").nullable(),
});

function projectInput(args: z.infer<typeof agentProjectSchema>) {
  return projectSchema.parse({
    ...args,
    contribution: args.contribution ?? undefined,
    statusLabel: args.statusLabel ?? undefined,
    iconKey: args.iconKey ?? undefined,
    iconAlt: args.iconAlt ?? undefined,
  });
}

function recognitionInput(args: z.infer<typeof agentRecognitionSchema>) {
  return recognitionSchema.parse({
    ...args,
    verificationUrl: args.verificationUrl ?? undefined,
  });
}

export function createPortfolioTools(): Tool<PortfolioAgentContext>[] {
  return [
    tool({
      name: "list_memories",
      description:
        "List the administrator-curated memories Bippy carries across conversations, including IDs needed for an explicit forget request.",
      parameters: z.object({}),
      execute: async (_args, context) =>
        audited(context, "list_memories", {}, listAssistantMemories),
    }),
    tool({
      name: "remember_for_future_chats",
      description:
        "Create or update one durable cross-conversation memory. Use only when the administrator explicitly asks to remember, save, or retain the information for future chats. Never call this from an implied preference or ordinary conversation.",
      parameters: z.object({
        label: z.string().trim().min(2).max(60),
        content: z.string().trim().min(2).max(500),
        category: z.enum(memoryCategories),
      }),
      execute: async (args, context) =>
        audited(context, "remember_for_future_chats", args, async () => {
          const owner = contextOf(context);
          return rememberAssistantMemory({
            ...args,
            sourceThreadId: owner.threadId,
          });
        }),
    }),
    tool({
      name: "propose_forgetting_memory",
      description:
        "Propose deleting a remembered item by UUID after the administrator explicitly asks Bippy to forget it. Approval is always required.",
      parameters: z.object({ id: z.uuid() }),
      execute: async (args, context) => {
        await requireAuthorizedToolCall();
        const memory = (await listAssistantMemories()).find(
          (item) => item.id === args.id,
        );
        if (!memory) throw new Error("Memory not found.");
        return proposed(
          context,
          "propose_forgetting_memory",
          "delete_memory",
          args,
          {
            title: `Forget memory: ${memory.label}`,
            before: memory,
            after: null,
          },
        );
      },
    }),
    tool({
      name: "read_portfolio_overview",
      description:
        "Read the current portfolio settings and compact summaries of projects, posts, recognitions, and Now content.",
      parameters: z.object({}),
      execute: async (_args, context) =>
        audited(context, "read_portfolio_overview", {}, async () => {
          const [settings, now, projects, posts, recognitions] =
            await Promise.all([
              getAdminSettings(),
              getAdminNow(),
              getAdminProjects(),
              getAdminPosts(),
              getAdminRecognitions(),
            ]);
          return {
            profile: {
              displayName: settings.displayName,
              role: settings.role,
              introduction: settings.introduction,
              email: settings.email,
            },
            seo: {
              title: settings.seoTitle,
              description: settings.seoDescription,
            },
            now,
            projects: projects.map((item) => ({
              id: item.id,
              title: item.title,
              published: item.published,
              pinned: Boolean(item.pinnedAt),
            })),
            posts: posts.map((item) => ({
              id: item.id,
              title: item.title,
              slug: item.slug,
              published: item.published,
              pinned: Boolean(item.pinnedAt),
            })),
            recognitions: recognitions.map((item) => ({
              id: item.id,
              title: item.title,
              published: item.published,
              pinned: Boolean(item.pinnedAt),
            })),
          };
        }),
    }),
    tool({
      name: "read_content_item",
      description:
        "Read one project, post, or recognition by its UUID before proposing an edit.",
      parameters: z.object({ kind: contentKind, id: z.uuid() }),
      execute: async (args, context) =>
        audited(context, "read_content_item", args, async () => {
          const item = await describeContent(args.kind, args.id);
          if (!item) throw new Error("Content item not found.");
          return item;
        }),
    }),
    tool({
      name: "create_project_draft",
      description:
        "Create an unpublished project draft. This is reversible and does not publish it.",
      parameters: agentProjectSchema,
      execute: async (args, context) =>
        audited(context, "create_project_draft", args, async () =>
          actionResult(await saveProject(projectInput(args), undefined, false)),
        ),
    }),
    tool({
      name: "create_post_draft",
      description:
        "Create an unpublished writing draft from Markdown. A unique slug is generated from the title.",
      parameters: z.object({
        title: z.string().trim().min(2).max(160),
        bodyMarkdown: z.string().trim().min(1),
        publishedAt: z.iso.datetime(),
        links: z.array(postLinkSchema).max(6),
      }),
      execute: async (args, context) =>
        audited(context, "create_post_draft", args, async () => {
          const slug = uniqueSlug(
            slugifyTitle(args.title),
            await getTakenSlugs(),
          );
          return actionResult(
            await savePost(
              {
                ...args,
                slug,
                publishedAt: new Date(args.publishedAt),
              },
              undefined,
              false,
            ),
          );
        }),
    }),
    tool({
      name: "create_recognition_draft",
      description:
        "Create an unpublished recognition draft. This does not put it on the public site.",
      parameters: agentRecognitionSchema,
      execute: async (args, context) =>
        audited(context, "create_recognition_draft", args, async () =>
          actionResult(
            await saveRecognition(recognitionInput(args), undefined, false),
          ),
        ),
    }),
    tool({
      name: "propose_project_update",
      description:
        "Propose replacing the editable fields of an existing project. The admin must approve before it is applied.",
      parameters: z.object({ id: z.uuid(), values: agentProjectSchema }),
      execute: async (args, context) => {
        await requireAuthorizedToolCall();
        const before = await describeContent("project", args.id);
        if (!before) throw new Error("Project not found.");
        const payload = { id: args.id, values: projectInput(args.values) };
        return proposed(
          context,
          "propose_project_update",
          "update_project",
          payload,
          {
            title: `Update project: ${contentTitle(before)}`,
            before,
            after: args.values,
          },
        );
      },
    }),
    tool({
      name: "propose_post_update",
      description:
        "Propose replacing an existing post's title, slug, Markdown body, date, and links. Approval is required.",
      parameters: z.object({
        id: z.uuid(),
        title: z.string().trim().min(2).max(160),
        slug: z
          .string()
          .trim()
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        bodyMarkdown: z.string().trim().min(1),
        publishedAt: z.iso.datetime(),
        links: z.array(postLinkSchema).max(6),
      }),
      execute: async (args, context) => {
        await requireAuthorizedToolCall();
        const before = await describeContent("post", args.id);
        if (!before) throw new Error("Post not found.");
        return proposed(context, "propose_post_update", "update_post", args, {
          title: `Update post: ${contentTitle(before)}`,
          before,
          after: args,
        });
      },
    }),
    tool({
      name: "propose_recognition_update",
      description:
        "Propose replacing an existing recognition. Approval is required.",
      parameters: z.object({ id: z.uuid(), values: agentRecognitionSchema }),
      execute: async (args, context) => {
        await requireAuthorizedToolCall();
        const before = await describeContent("recognition", args.id);
        if (!before) throw new Error("Recognition not found.");
        const payload = { id: args.id, values: recognitionInput(args.values) };
        return proposed(
          context,
          "propose_recognition_update",
          "update_recognition",
          payload,
          {
            title: `Update recognition: ${contentTitle(before)}`,
            before,
            after: args.values,
          },
        );
      },
    }),
    tool({
      name: "propose_placement_change",
      description:
        "Propose publishing/unpublishing or pinning/unpinning a content item. Any public placement change requires approval.",
      parameters: z.object({
        kind: contentKind,
        id: z.uuid(),
        placement: z.enum(["published", "pinned"]),
        value: z.boolean(),
      }),
      execute: async (args, context) => {
        await requireAuthorizedToolCall();
        const item = await describeContent(args.kind, args.id);
        if (!item) throw new Error("Content item not found.");
        const payload = { kind: args.kind, id: args.id, value: args.value };
        return proposed(
          context,
          "propose_placement_change",
          args.placement === "published" ? "set_published" : "set_pinned",
          payload,
          {
            title: `${args.value ? "Enable" : "Disable"} ${args.placement}`,
            content: item,
          },
        );
      },
    }),
    tool({
      name: "propose_content_deletion",
      description:
        "Propose permanently deleting a project, post, or recognition. Deletion always requires approval.",
      parameters: z.object({ kind: contentKind, id: z.uuid() }),
      execute: async (args, context) => {
        await requireAuthorizedToolCall();
        const item = await describeContent(args.kind, args.id);
        if (!item) throw new Error("Content item not found.");
        return proposed(
          context,
          "propose_content_deletion",
          "delete_content",
          args,
          {
            title: `Delete ${args.kind}`,
            before: item,
            after: null,
          },
        );
      },
    }),
    tool({
      name: "propose_now_update",
      description:
        "Propose changing the public Now description or visibility. Approval is required.",
      parameters: nowSectionSchema,
      execute: async (args, context) => {
        await requireAuthorizedToolCall();
        const before = await getAdminNow();
        return proposed(context, "propose_now_update", "update_now", args, {
          title: "Update Now section",
          before: before.section,
          after: args,
        });
      },
    }),
    tool({
      name: "propose_seo_update",
      description:
        "Propose changing the site's default SEO title and description. Approval is required.",
      parameters: seoSchema,
      execute: async (args, context) => {
        await requireAuthorizedToolCall();
        const settings = await getAdminSettings();
        return proposed(context, "propose_seo_update", "update_seo", args, {
          title: "Update SEO defaults",
          before: {
            seoTitle: settings.seoTitle,
            seoDescription: settings.seoDescription,
          },
          after: args,
        });
      },
    }),
  ];
}
