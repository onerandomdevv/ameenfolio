import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getDb } from "@/db/client";
import { agentApprovals, agentRuns } from "@/db/schema";
import {
  getAdminNow,
  getAdminPost,
  getAdminPosts,
  getAdminProject,
  getAdminProjects,
  getAdminRecognitions,
  getAdminSettings,
  getAdminTechStack,
} from "@/db/queries";
import { createApproval, recordToolCall } from "@/lib/ai/repository";
import { decideMcpApproval } from "@/lib/ai/approvals";
import { postLinkIconValues } from "@/config/post-link-icons";
import { projectIconValues } from "@/config/project-icons";
import { recognitionIconNames } from "@/config/recognition-icons";
import {
  nowSectionSchema,
  projectSchema,
  recognitionSchema,
  seoSchema,
  techStackItemSchema,
  techStackOrderSchema,
} from "@/lib/validation";
import { techStackGroupValues } from "@/config/tech-stack";
import type { McpOAuthClient } from "@/db/schema";
import { signPreviewDownload, signUpload } from "@/lib/storage/server";
import { isManagedObjectKey, validateUpload } from "@/lib/storage/rules";

const contentKind = z.enum(["project", "post", "recognition"]);
const postLinkSchema = z.object({
  label: z.string().trim().min(1).max(80),
  url: z.url().startsWith("https://"),
  iconName: z.enum(postLinkIconValues),
  displayOrder: z.number().int().min(0).max(999),
});
const postDraftSchema = z.object({
  title: z.string().trim().min(2).max(160),
  bodyMarkdown: z.string().trim().min(1),
  publishedAt: z.iso.datetime(),
  links: z.array(postLinkSchema).max(6).default([]),
});
const postUpdateSchema = postDraftSchema.extend({
  id: z.uuid(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

const contactLinkPatchSchema = z
  .object({
    email: z.email().optional(),
    github: z.url().startsWith("https://").nullable().optional(),
    x: z.url().startsWith("https://").nullable().optional(),
    instagram: z.url().startsWith("https://").nullable().optional(),
    tiktok: z.url().startsWith("https://").nullable().optional(),
    youtube: z.url().startsWith("https://").nullable().optional(),
    linkedin: z.url().startsWith("https://").nullable().optional(),
    whatsapp: z.url().startsWith("https://").nullable().optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "Provide at least one contact field to update.",
  });

const resumeReplacementSchema = z
  .object({
    resumeKey: z
      .string()
      .regex(/^resumes\/\d{4}\/[a-f0-9]{48}\.pdf$/)
      .nullable(),
    resumeFilename: z.string().trim().min(1).max(180).nullable(),
  })
  .refine(
    (value) => !value.resumeKey || Boolean(value.resumeFilename),
    "A filename is required when a résumé is supplied.",
  );

const projectIconUpdateSchema = z
  .object({
    id: z.uuid(),
    iconName: z.enum(projectIconValues),
    iconKey: z
      .string()
      .regex(/^icons\/\d{4}\/[a-f0-9]{48}\.(png|jpg|webp)$/)
      .nullable()
      .optional(),
    iconAlt: z.string().trim().max(180).nullable().optional(),
  })
  .refine((value) => !value.iconKey || Boolean(value.iconAlt), {
    path: ["iconAlt"],
    message: "Alt text is required for an uploaded icon.",
  });

const techStackUpdateSchema = z.object({
  id: z.uuid(),
  values: techStackItemSchema,
});
const techStackDeleteSchema = z.object({ id: z.uuid() });
const techStackDraftSchema = z.object({
  name: z.string().trim().min(1).max(40),
  groupKey: z.enum(techStackGroupValues),
  displayOrder: z.number().int().min(0).max(999).default(0),
});

type McpActor = {
  client: McpOAuthClient;
  scopes: string[];
};

function oauth(
  scope: "portfolio:read" | "portfolio:draft" | "portfolio:propose",
) {
  return [{ type: "oauth2" as const, scopes: [scope] }];
}

function security(
  scope: "portfolio:read" | "portfolio:draft" | "portfolio:propose",
) {
  // The current MCP SDK serializes extension metadata through `_meta`.
  return { _meta: { securitySchemes: oauth(scope) } };
}

function jsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
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

async function audited<T>(
  actor: McpActor,
  toolName: string,
  args: Record<string, unknown>,
  execute: (run: {
    threadId: string;
    runId: string;
    toolCallId: string;
  }) => Promise<T>,
  requiresApproval = false,
) {
  if (!actor.client.threadId)
    throw new Error("The MCP connection has no audit thread.");
  const [run] = await getDb()
    .insert(agentRuns)
    .values({
      threadId: actor.client.threadId,
      provider: "mcp",
      model: "external-client",
      status: "running",
    })
    .returning();
  try {
    const { result } = await recordToolCall({
      threadId: actor.client.threadId,
      runId: run.id,
      toolName,
      arguments: args,
      requiresApproval,
      execute: (call) =>
        execute({
          threadId: actor.client.threadId!,
          runId: run.id,
          toolCallId: call.id,
        }),
    });
    await getDb()
      .update(agentRuns)
      .set({ status: "completed", finishedAt: new Date() })
      .where(eq(agentRuns.id, run.id));
    return result as T;
  } catch (error) {
    await getDb()
      .update(agentRuns)
      .set({ status: "failed", error: String(error), finishedAt: new Date() })
      .where(eq(agentRuns.id, run.id));
    throw error;
  }
}

async function proposal(
  actor: McpActor,
  toolName: string,
  actionType: string,
  payload: Record<string, unknown>,
  preview: Record<string, unknown>,
) {
  return audited(
    actor,
    toolName,
    payload,
    async ({ threadId, runId, toolCallId }) => {
      const approval = await createApproval({
        threadId,
        runId,
        toolCallId,
        actionType,
        payload,
        preview,
      });
      return {
        approvalId: approval.id,
        status: "pending",
        preview,
        message:
          "Proposal ready for review in this conversation. Tell the MCP client to approve or reject it explicitly; the admin MCP page remains available as an audit fallback.",
      };
    },
    true,
  );
}

async function previewMarkdownImages(markdown: string) {
  const keys = [
    ...new Set(
      [...markdown.matchAll(/\]\(\/media\/([^\s)]+)\)/g)]
        .map((match) => match[1])
        .filter(
          (key): key is string => Boolean(key) && isManagedObjectKey(key),
        ),
    ),
  ];
  let preview = markdown;
  for (const key of keys) {
    const signedUrl = await signPreviewDownload(key);
    preview = preview.replaceAll(`/media/${key}`, signedUrl);
  }
  return preview;
}

function result(data: unknown, summary: string) {
  return {
    structuredContent: jsonValue(data),
    content: [{ type: "text" as const, text: summary }],
  };
}

function requireScope(actor: McpActor, scope: string) {
  if (!actor.scopes.includes(scope))
    throw new Error(`Missing required scope: ${scope}`);
}

export function createBippyMcpServer(actor: McpActor) {
  const server = new McpServer(
    { name: "bippy-portfolio", version: "1.0.0" },
    {
      instructions:
        "Ameenfolio MCP manages Aliameen Kareem's portfolio. Read current content before preparing changes. Drafts and every public, destructive, placement, Now, or SEO change are recorded as proposals; return the preview in the conversation and require the owner's explicit approval before applying it. The admin approvals page is an audit fallback.",
    },
  );

  server.registerTool(
    "read_portfolio_overview",
    {
      title: "Read portfolio overview",
      description:
        "Read settings and compact summaries of all portfolio content.",
      inputSchema: {},
      ...security("portfolio:read"),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async () => {
      requireScope(actor, "portfolio:read");
      const data = await audited(
        actor,
        "read_portfolio_overview",
        {},
        async () => {
          const [settings, now, projects, posts, recognitions, techStack] =
            await Promise.all([
              getAdminSettings(),
              getAdminNow(),
              getAdminProjects(),
              getAdminPosts(),
              getAdminRecognitions(),
              getAdminTechStack(),
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
            projects: projects.map(({ id, title, published, pinnedAt }) => ({
              id,
              title,
              published,
              pinned: Boolean(pinnedAt),
            })),
            posts: posts.map(({ id, title, slug, published, pinnedAt }) => ({
              id,
              title,
              slug,
              published,
              pinned: Boolean(pinnedAt),
            })),
            recognitions: recognitions.map(
              ({ id, title, published, pinnedAt }) => ({
                id,
                title,
                published,
                pinned: Boolean(pinnedAt),
              }),
            ),
            techStack: techStack.map(
              ({ id, name, groupKey, displayOrder, visible }) => ({
                id,
                name,
                groupKey,
                displayOrder,
                visible,
              }),
            ),
          };
        },
      );
      return result(data, "Portfolio overview loaded.");
    },
  );

  server.registerTool(
    "approve_mcp_proposal",
    {
      title: "Approve MCP proposal",
      description:
        "Approve or reject a proposal created by this MCP connection after the owner has explicitly reviewed it.",
      inputSchema: {
        approvalId: z.uuid(),
        decision: z.enum(["approve", "reject"]),
      },
      ...security("portfolio:propose"),
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: true,
      },
    },
    async (args) => {
      requireScope(actor, "portfolio:propose");
      const applied = await audited(
        actor,
        "approve_mcp_proposal",
        args,
        async () => {
          if (!actor.client.threadId) {
            throw new Error("The MCP connection has no audit thread.");
          }
          return decideMcpApproval(
            args.approvalId,
            args.decision,
            actor.client.threadId,
          );
        },
      );
      return result(
        applied,
        args.decision === "approve"
          ? "MCP proposal approved and applied."
          : "MCP proposal rejected.",
      );
    },
  );

  server.registerTool(
    "list_mcp_pending_proposals",
    {
      title: "List pending MCP proposals",
      description:
        "List proposals created by this MCP connection so the owner can review one before explicitly approving or rejecting it.",
      inputSchema: {},
      ...security("portfolio:propose"),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async () => {
      requireScope(actor, "portfolio:propose");
      const data = await audited(
        actor,
        "list_mcp_pending_proposals",
        {},
        async () => {
          if (!actor.client.threadId)
            throw new Error("The MCP connection has no audit thread.");
          const rows = await getDb()
            .select({
              id: agentApprovals.id,
              actionType: agentApprovals.actionType,
              preview: agentApprovals.preview,
              requestedAt: agentApprovals.requestedAt,
            })
            .from(agentApprovals)
            .where(
              and(
                eq(agentApprovals.threadId, actor.client.threadId),
                eq(agentApprovals.status, "pending"),
              ),
            )
            .orderBy(asc(agentApprovals.requestedAt));
          return rows
            .filter((row) => row.preview && row.id)
            .map((row) => ({
              id: row.id,
              actionType: row.actionType,
              preview: row.preview,
              requestedAt: row.requestedAt.toISOString(),
            }));
        },
      );
      return result(data, "Pending MCP proposals loaded.");
    },
  );

  server.registerTool(
    "read_content_item",
    {
      title: "Read content item",
      description:
        "Read one project, post, or recognition by UUID before preparing a change.",
      inputSchema: { kind: contentKind, id: z.uuid() },
      ...security("portfolio:read"),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args) => {
      requireScope(actor, "portfolio:read");
      const item = await audited(actor, "read_content_item", args, async () =>
        describeContent(args.kind, args.id),
      );
      if (!item) throw new Error("Content item not found.");
      return result({ item }, "Content item loaded.");
    },
  );

  server.registerTool(
    "read_tech_stack",
    {
      title: "Read tech stack",
      description:
        "Read every technology managed in the admin Tech Stack area, including visibility and order.",
      inputSchema: {},
      ...security("portfolio:read"),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async () => {
      requireScope(actor, "portfolio:read");
      const items = await audited(actor, "read_tech_stack", {}, () =>
        getAdminTechStack(),
      );
      return result(items, "Tech Stack loaded.");
    },
  );

  server.registerTool(
    "prepare_tech_stack_item_draft",
    {
      title: "Prepare Tech Stack item",
      description:
        "Prepare a hidden Tech Stack item for owner approval. Visibility can be changed later with an approved update.",
      inputSchema: techStackDraftSchema.shape,
      ...security("portfolio:draft"),
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args) => {
      requireScope(actor, "portfolio:draft");
      const values = techStackItemSchema.parse({
        ...techStackDraftSchema.parse(args),
        visible: false,
      });
      const pending = await proposal(
        actor,
        "prepare_tech_stack_item_draft",
        "create_tech_stack_draft",
        values,
        {
          title: `Create Tech Stack item: ${values.name}`,
          before: null,
          after: values,
        },
      );
      return result(
        pending,
        "Tech Stack item proposal created for admin approval.",
      );
    },
  );

  server.registerTool(
    "prepare_tech_stack_item_update",
    {
      title: "Prepare Tech Stack update",
      description:
        "Prepare an update to an existing Tech Stack item for owner approval.",
      inputSchema: techStackUpdateSchema.shape,
      ...security("portfolio:propose"),
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args) => {
      requireScope(actor, "portfolio:propose");
      const values = techStackUpdateSchema.parse(args);
      const current = (await getAdminTechStack()).find(
        (item) => item.id === values.id,
      );
      if (!current) throw new Error("Tech Stack item not found.");
      const pending = await proposal(
        actor,
        "prepare_tech_stack_item_update",
        "update_tech_stack",
        values,
        {
          title: `Update Tech Stack item: ${values.values.name}`,
          before: current,
          after: values.values,
        },
      );
      return result(
        pending,
        "Tech Stack update proposal created for admin approval.",
      );
    },
  );

  server.registerTool(
    "prepare_tech_stack_item_delete",
    {
      title: "Prepare Tech Stack deletion",
      description: "Prepare deletion of a Tech Stack item for owner approval.",
      inputSchema: techStackDeleteSchema.shape,
      ...security("portfolio:propose"),
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: true,
      },
    },
    async (args) => {
      requireScope(actor, "portfolio:propose");
      const values = techStackDeleteSchema.parse(args);
      const current = (await getAdminTechStack()).find(
        (item) => item.id === values.id,
      );
      if (!current) throw new Error("Tech Stack item not found.");
      const pending = await proposal(
        actor,
        "prepare_tech_stack_item_delete",
        "delete_tech_stack",
        values,
        {
          title: `Delete Tech Stack item: ${current.name}`,
          before: current,
          after: null,
        },
      );
      return result(
        pending,
        "Tech Stack deletion proposal created for admin approval.",
      );
    },
  );

  server.registerTool(
    "prepare_tech_stack_reorder",
    {
      title: "Prepare Tech Stack reorder",
      description:
        "Prepare a Tech Stack group/order change for owner approval.",
      inputSchema: { order: techStackOrderSchema },
      ...security("portfolio:propose"),
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args) => {
      requireScope(actor, "portfolio:propose");
      const order = techStackOrderSchema.parse(args.order);
      const current = await getAdminTechStack();
      const knownIds = new Set(current.map((item) => item.id));
      if (order.some((item) => !knownIds.has(item.id)))
        throw new Error("Order includes an unknown Tech Stack item.");
      const pending = await proposal(
        actor,
        "prepare_tech_stack_reorder",
        "reorder_tech_stack",
        { order },
        {
          title: "Reorder Tech Stack",
          before: current.map(({ id, groupKey, displayOrder }) => ({
            id,
            groupKey,
            displayOrder,
          })),
          after: order,
        },
      );
      return result(
        pending,
        "Tech Stack reorder proposal created for admin approval.",
      );
    },
  );

  server.registerTool(
    "prepare_project_draft",
    {
      title: "Prepare project draft",
      description:
        "Prepare a private project draft for approval. This never publishes it.",
      inputSchema: projectSchema.shape,
      ...security("portfolio:draft"),
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args) => {
      requireScope(actor, "portfolio:draft");
      const values = projectSchema.parse(args);
      const pending = await proposal(
        actor,
        "prepare_project_draft",
        "create_project_draft",
        values,
        {
          title: `Create project draft: ${values.title}`,
          before: null,
          after: values,
        },
      );
      return result(
        pending,
        "Project draft proposal created for admin approval.",
      );
    },
  );

  server.registerTool(
    "prepare_post_draft",
    {
      title: "Prepare writing draft",
      description: "Prepare a private Markdown writing draft for approval.",
      inputSchema: postDraftSchema.shape,
      ...security("portfolio:draft"),
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args) => {
      requireScope(actor, "portfolio:draft");
      const values = postDraftSchema.parse(args);
      const previewBody = await previewMarkdownImages(values.bodyMarkdown);
      const pending = await proposal(
        actor,
        "prepare_post_draft",
        "create_post_draft",
        values,
        {
          title: `Create writing draft: ${values.title}`,
          before: null,
          after: { ...values, bodyMarkdown: previewBody },
        },
      );
      return result(
        pending,
        "Writing draft proposal created for admin approval.",
      );
    },
  );

  server.registerTool(
    "prepare_recognition_draft",
    {
      title: "Prepare recognition draft",
      description: "Prepare a private recognition draft for approval.",
      inputSchema: recognitionSchema.shape,
      ...security("portfolio:draft"),
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args) => {
      requireScope(actor, "portfolio:draft");
      const values = recognitionSchema.parse(args);
      const pending = await proposal(
        actor,
        "prepare_recognition_draft",
        "create_recognition_draft",
        values,
        {
          title: `Create recognition draft: ${values.title}`,
          before: null,
          after: values,
        },
      );
      return result(
        pending,
        "Recognition draft proposal created for admin approval.",
      );
    },
  );

  server.registerTool(
    "prepare_now_update",
    {
      title: "Prepare Now update",
      description:
        "Prepare a change to the public Now section for admin approval.",
      inputSchema: nowSectionSchema.shape,
      ...security("portfolio:propose"),
      annotations: {
        readOnlyHint: false,
        openWorldHint: true,
        destructiveHint: false,
      },
    },
    async (args) => {
      requireScope(actor, "portfolio:propose");
      const values = nowSectionSchema.parse(args);
      const before = await getAdminNow();
      const pending = await proposal(
        actor,
        "prepare_now_update",
        "update_now",
        values,
        {
          title: "Update Now section",
          before: before.section,
          after: values,
        },
      );
      return result(pending, "Now update prepared for admin approval.");
    },
  );

  server.registerTool(
    "prepare_project_update",
    {
      title: "Prepare project update",
      description:
        "Prepare replacement fields for an existing project after reading it.",
      inputSchema: { id: z.uuid(), values: projectSchema },
      ...security("portfolio:propose"),
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args) => {
      requireScope(actor, "portfolio:propose");
      const before = await describeContent("project", args.id);
      if (!before) throw new Error("Project not found.");
      const values = projectSchema.parse(args.values);
      const pending = await proposal(
        actor,
        "prepare_project_update",
        "update_project",
        { id: args.id, values },
        {
          title: `Update project: ${contentTitle(before)}`,
          before,
          after: values,
        },
      );
      return result(pending, "Project update prepared for admin approval.");
    },
  );

  server.registerTool(
    "prepare_post_update",
    {
      title: "Prepare writing update",
      description:
        "Prepare replacement fields for an existing writing post after reading it.",
      inputSchema: postUpdateSchema.shape,
      ...security("portfolio:propose"),
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args) => {
      requireScope(actor, "portfolio:propose");
      const before = await describeContent("post", args.id);
      if (!before) throw new Error("Post not found.");
      const values = postUpdateSchema.parse(args);
      const previewBody = await previewMarkdownImages(values.bodyMarkdown);
      const pending = await proposal(
        actor,
        "prepare_post_update",
        "update_post",
        values,
        {
          title: `Update post: ${contentTitle(before)}`,
          before,
          after: { ...values, bodyMarkdown: previewBody },
        },
      );
      return result(pending, "Writing update prepared for admin approval.");
    },
  );

  server.registerTool(
    "prepare_recognition_update",
    {
      title: "Prepare recognition update",
      description:
        "Prepare replacement fields for an existing recognition after reading it.",
      inputSchema: { id: z.uuid(), values: recognitionSchema },
      ...security("portfolio:propose"),
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args) => {
      requireScope(actor, "portfolio:propose");
      const before = await describeContent("recognition", args.id);
      if (!before) throw new Error("Recognition not found.");
      const values = recognitionSchema.parse(args.values);
      const pending = await proposal(
        actor,
        "prepare_recognition_update",
        "update_recognition",
        { id: args.id, values },
        {
          title: `Update recognition: ${contentTitle(before)}`,
          before,
          after: values,
        },
      );
      return result(pending, "Recognition update prepared for admin approval.");
    },
  );

  server.registerTool(
    "prepare_placement_change",
    {
      title: "Prepare publication or pin change",
      description:
        "Prepare publishing, unpublishing, pinning, or unpinning a content item.",
      inputSchema: {
        kind: contentKind,
        id: z.uuid(),
        placement: z.enum(["published", "pinned"]),
        value: z.boolean(),
      },
      ...security("portfolio:propose"),
      annotations: {
        readOnlyHint: false,
        openWorldHint: true,
        destructiveHint: false,
      },
    },
    async (args) => {
      requireScope(actor, "portfolio:propose");
      const item = await describeContent(args.kind, args.id);
      if (!item) throw new Error("Content item not found.");
      const payload = { kind: args.kind, id: args.id, value: args.value };
      const pending = await proposal(
        actor,
        "prepare_placement_change",
        args.placement === "published" ? "set_published" : "set_pinned",
        payload,
        {
          title: `${args.value ? "Enable" : "Disable"} ${args.placement}`,
          content: item,
        },
      );
      return result(pending, "Placement change prepared for admin approval.");
    },
  );

  server.registerTool(
    "prepare_content_deletion",
    {
      title: "Prepare content deletion",
      description:
        "Prepare permanent deletion of a project, post, or recognition.",
      inputSchema: { kind: contentKind, id: z.uuid() },
      ...security("portfolio:propose"),
      annotations: {
        readOnlyHint: false,
        openWorldHint: true,
        destructiveHint: true,
      },
    },
    async (args) => {
      requireScope(actor, "portfolio:propose");
      const item = await describeContent(args.kind, args.id);
      if (!item) throw new Error("Content item not found.");
      const pending = await proposal(
        actor,
        "prepare_content_deletion",
        "delete_content",
        args,
        {
          title: `Delete ${args.kind}`,
          before: item,
          after: null,
        },
      );
      return result(pending, "Deletion prepared for admin approval.");
    },
  );

  server.registerTool(
    "request_media_upload",
    {
      title: "Request media upload",
      description:
        "Create a five-minute signed upload slot for a project icon or PDF résumé. Upload bytes with PUT, then use the returned object key in a prepared change.",
      inputSchema: {
        resourceType: z.enum(["icon", "post", "resume"]),
        filename: z.string().trim().min(1).max(180),
        contentType: z.enum([
          "image/png",
          "image/jpeg",
          "image/webp",
          "image/gif",
          "application/pdf",
        ]),
        size: z.number().int().positive(),
      },
      ...security("portfolio:propose"),
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args) => {
      requireScope(actor, "portfolio:propose");
      if (!validateUpload(args.resourceType, args.contentType, args.size)) {
        throw new Error("The requested file type or size is not permitted.");
      }
      const upload = await audited(
        actor,
        "request_media_upload",
        args,
        async () => signUpload(args.resourceType, args.contentType),
      );
      return result(
        { ...upload, expiresInSeconds: 300, contentType: args.contentType },
        "Upload slot created. PUT the exact content type within five minutes, then prepare the content change with the returned key.",
      );
    },
  );

  server.registerTool(
    "prepare_contact_update",
    {
      title: "Prepare contact update",
      description:
        "Prepare changes to the public email and social-profile links. Null removes a social link.",
      inputSchema: contactLinkPatchSchema,
      ...security("portfolio:propose"),
      annotations: {
        readOnlyHint: false,
        openWorldHint: true,
        destructiveHint: false,
      },
    },
    async (args) => {
      requireScope(actor, "portfolio:propose");
      const values = contactLinkPatchSchema.parse(args);
      const before = await getAdminSettings();
      const pending = await proposal(
        actor,
        "prepare_contact_update",
        "update_contacts",
        values,
        {
          title: "Update contact links",
          before: { email: before.email, contactLinks: before.contactLinks },
          after: values,
        },
      );
      return result(pending, "Contact update prepared for admin approval.");
    },
  );

  server.registerTool(
    "prepare_resume_replacement",
    {
      title: "Prepare résumé replacement",
      description:
        "Prepare an uploaded PDF as the public résumé, or pass null values to remove the current résumé.",
      inputSchema: resumeReplacementSchema,
      ...security("portfolio:propose"),
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args) => {
      requireScope(actor, "portfolio:propose");
      const values = resumeReplacementSchema.parse(args);
      const before = await getAdminSettings();
      const pending = await proposal(
        actor,
        "prepare_resume_replacement",
        "update_resume",
        values,
        {
          title: values.resumeKey ? "Replace résumé" : "Remove résumé",
          before: {
            resumeKey: before.resumeKey,
            resumeFilename: before.resumeFilename,
          },
          after: values,
        },
      );
      return result(pending, "Résumé change prepared for admin approval.");
    },
  );

  server.registerTool(
    "prepare_project_icon_update",
    {
      title: "Prepare project icon update",
      description:
        "Prepare a built-in or previously uploaded icon for an existing project.",
      inputSchema: projectIconUpdateSchema,
      ...security("portfolio:propose"),
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args) => {
      requireScope(actor, "portfolio:propose");
      const values = projectIconUpdateSchema.parse(args);
      const before = await getAdminProject(values.id);
      if (!before) throw new Error("Project not found.");
      const pending = await proposal(
        actor,
        "prepare_project_icon_update",
        "update_project_icon",
        values,
        {
          title: `Update project icon: ${before.title}`,
          before: {
            iconName: before.iconName,
            iconKey: before.iconKey,
            iconAlt: before.iconAlt,
          },
          after: values,
        },
      );
      return result(
        pending,
        "Project icon change prepared for admin approval.",
      );
    },
  );

  server.registerTool(
    "prepare_recognition_icon_update",
    {
      title: "Prepare recognition icon update",
      description:
        "Prepare a built-in icon change for an existing recognition.",
      inputSchema: { id: z.uuid(), iconName: z.enum(recognitionIconNames) },
      ...security("portfolio:propose"),
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (args) => {
      requireScope(actor, "portfolio:propose");
      const before = (await getAdminRecognitions()).find(
        (item) => item.id === args.id,
      );
      if (!before) throw new Error("Recognition not found.");
      const pending = await proposal(
        actor,
        "prepare_recognition_icon_update",
        "update_recognition_icon",
        args,
        {
          title: `Update recognition icon: ${before.title}`,
          before: { iconName: before.iconName },
          after: args,
        },
      );
      return result(
        pending,
        "Recognition icon change prepared for admin approval.",
      );
    },
  );

  server.registerTool(
    "prepare_seo_update",
    {
      title: "Prepare SEO update",
      description:
        "Prepare default SEO title and description changes for admin approval.",
      inputSchema: seoSchema.shape,
      ...security("portfolio:propose"),
      annotations: {
        readOnlyHint: false,
        openWorldHint: true,
        destructiveHint: false,
      },
    },
    async (args) => {
      requireScope(actor, "portfolio:propose");
      const values = seoSchema.parse(args);
      const settings = await getAdminSettings();
      const pending = await proposal(
        actor,
        "prepare_seo_update",
        "update_seo",
        values,
        {
          title: "Update SEO defaults",
          before: {
            seoTitle: settings.seoTitle,
            seoDescription: settings.seoDescription,
          },
          after: values,
        },
      );
      return result(pending, "SEO update prepared for admin approval.");
    },
  );

  return server;
}
