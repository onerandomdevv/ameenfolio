import "server-only";

import { z } from "zod";
import { deleteProject, saveProject } from "@/app/admin/actions/projects";
import {
  deleteRecognition,
  saveRecognition,
} from "@/app/admin/actions/recognitions";
import { saveNowSection } from "@/app/admin/actions/now";
import { setPinned, setPublished } from "@/app/admin/actions/placement";
import { saveProfile, saveSeo } from "@/app/admin/actions/settings";
import { deletePost, savePost } from "@/app/admin/actions/writing";
import {
  deleteTechStackItem,
  reorderTechStack,
  saveTechStackItem,
} from "@/app/admin/actions/tech-stack";
import { requireAdmin, runAsMcpMutation } from "@/lib/auth/server";
import { getDb } from "@/db/client";
import { agentApprovals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deleteAssistantMemory } from "@/lib/ai/memory";
import {
  approvalView,
  claimApproval,
  rejectApprovalWithPayload,
  resolveApproval,
} from "@/lib/ai/repository";
import {
  nowSectionSchema,
  profileSchema,
  projectSchema,
  recognitionSchema,
  seoSchema,
  techStackItemSchema,
  techStackOrderSchema,
} from "@/lib/validation";
import { postLinkIconValues } from "@/config/post-link-icons";
import {
  getAdminProject,
  getAdminRecognitions,
  getAdminSettings,
  getTakenSlugs,
  isReferencedManagedObject,
} from "@/db/queries";
import { slugifyTitle, uniqueSlug } from "@/lib/writing/slug";
import { resolveIdentity } from "@/lib/identity";
import { projectIconValues } from "@/config/project-icons";
import { recognitionIconNames } from "@/config/recognition-icons";
import { deleteObject } from "@/lib/storage/server";

const placementSchema = z.object({
  kind: z.enum(["project", "post", "recognition"]),
  id: z.uuid(),
  value: z.boolean(),
});

const deleteSchema = z.object({
  kind: z.enum(["project", "post", "recognition"]),
  id: z.uuid(),
});

const contactPatchSchema = z.object({
  email: z.email().optional(),
  github: z.url().startsWith("https://").nullable().optional(),
  x: z.url().startsWith("https://").nullable().optional(),
  instagram: z.url().startsWith("https://").nullable().optional(),
  tiktok: z.url().startsWith("https://").nullable().optional(),
  youtube: z.url().startsWith("https://").nullable().optional(),
  linkedin: z.url().startsWith("https://").nullable().optional(),
  whatsapp: z.url().startsWith("https://").nullable().optional(),
});

const resumeReplacementSchema = z
  .object({
    resumeKey: z
      .string()
      .regex(/^resumes\/\d{4}\/[a-f0-9]{48}\.pdf$/)
      .nullable(),
    resumeFilename: z.string().trim().min(1).max(180).nullable(),
  })
  .refine((value) => !value.resumeKey || Boolean(value.resumeFilename));

async function currentProfile() {
  const settings = await getAdminSettings();
  const identity = resolveIdentity(settings);
  return {
    displayName: identity.name,
    role: identity.role,
    introduction: identity.introduction,
    email: settings.email,
    contactLinks: settings.contactLinks ?? {},
    profileImageKey: settings.profileImageKey ?? undefined,
    resumeKey: settings.resumeKey ?? undefined,
    resumeFilename: settings.resumeFilename ?? undefined,
    hackathonWins: settings.hackathonWins,
    availability: settings.availability,
  };
}

async function cleanupRejectedUpload(approval: {
  actionType: string;
  payload: Record<string, unknown>;
}) {
  const key =
    approval.actionType === "update_resume"
      ? resumeReplacementSchema.safeParse(approval.payload).data?.resumeKey
      : approval.actionType === "update_project_icon"
        ? z
            .object({ iconKey: z.string().nullable().optional() })
            .safeParse(approval.payload).data?.iconKey
        : null;
  if (key && !(await isReferencedManagedObject(key))) await deleteObject(key);
}

export const proposedPostSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  bodyMarkdown: z.string().trim().min(1),
  publishedAt: z.iso.datetime(),
  links: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(80),
        url: z.url().startsWith("https://"),
        iconName: z.enum(postLinkIconValues),
        displayOrder: z.number().int().min(0).max(999),
      }),
    )
    .max(6),
});

function actionError(result: { ok: boolean; message?: string }) {
  if (!result.ok) throw new Error(result.message || "The action failed.");
}

async function executeApprovalDecision(
  id: string,
  decision: "approve" | "reject",
) {
  if (decision === "reject") {
    const rejected = await rejectApprovalWithPayload(id);
    if (!rejected) throw new Error("This approval is no longer pending.");
    await cleanupRejectedUpload(rejected);
    return approvalView(rejected);
  }

  // The status transition is the lock: only one request can change pending to
  // approved, so a double click or retry cannot execute the mutation twice.
  const approval = await claimApproval(id);
  if (!approval) throw new Error("This approval is no longer pending.");

  try {
    switch (approval.actionType) {
      case "set_published": {
        const input = placementSchema.parse(approval.payload);
        actionError(
          await setPublished(input.kind, {
            id: input.id,
            published: input.value,
          }),
        );
        break;
      }
      case "set_pinned": {
        const input = placementSchema.parse(approval.payload);
        actionError(
          await setPinned(input.kind, { id: input.id, pinned: input.value }),
        );
        break;
      }
      case "delete_content": {
        const input = deleteSchema.parse(approval.payload);
        const result =
          input.kind === "project"
            ? await deleteProject(input.id)
            : input.kind === "post"
              ? await deletePost(input.id)
              : await deleteRecognition(input.id);
        actionError(result);
        break;
      }
      case "delete_memory": {
        const input = z.object({ id: z.uuid() }).parse(approval.payload);
        if (!(await deleteAssistantMemory(input.id))) {
          throw new Error("Memory not found.");
        }
        break;
      }
      case "update_now": {
        actionError(
          await saveNowSection(nowSectionSchema.parse(approval.payload)),
        );
        break;
      }
      case "update_seo": {
        actionError(await saveSeo(seoSchema.parse(approval.payload)));
        break;
      }
      case "update_contacts": {
        const patch = contactPatchSchema.parse(approval.payload);
        const profile = await currentProfile();
        const links = { ...profile.contactLinks } as Record<
          string,
          string | undefined
        >;
        for (const [key, value] of Object.entries(patch)) {
          if (key === "email" || value === undefined) continue;
          links[key] = value ?? undefined;
        }
        actionError(
          await saveProfile(
            profileSchema.parse({
              ...profile,
              email: patch.email ?? profile.email,
              contactLinks: links,
            }),
          ),
        );
        break;
      }
      case "update_resume": {
        const values = resumeReplacementSchema.parse(approval.payload);
        const profile = await currentProfile();
        actionError(
          await saveProfile(
            profileSchema.parse({
              ...profile,
              resumeKey: values.resumeKey ?? undefined,
              resumeFilename: values.resumeFilename ?? undefined,
            }),
          ),
        );
        break;
      }
      case "update_project_icon": {
        const values = z
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
          .parse(approval.payload);
        const project = await getAdminProject(values.id);
        if (!project) throw new Error("Project not found.");
        actionError(
          await saveProject(
            projectSchema.parse({
              title: project.title,
              shortDescription: project.shortDescription,
              contribution: project.contribution ?? undefined,
              statusLabel: project.statusLabel ?? undefined,
              url: project.url,
              iconName: values.iconName,
              iconKey: values.iconKey ?? undefined,
              iconAlt: values.iconAlt ?? undefined,
            }),
            project.id,
          ),
        );
        break;
      }
      case "update_recognition_icon": {
        const values = z
          .object({ id: z.uuid(), iconName: z.enum(recognitionIconNames) })
          .parse(approval.payload);
        const recognition = (await getAdminRecognitions()).find(
          (item) => item.id === values.id,
        );
        if (!recognition) throw new Error("Recognition not found.");
        actionError(
          await saveRecognition(
            recognitionSchema.parse({
              title: recognition.title,
              iconName: values.iconName,
              verificationUrl: recognition.verificationUrl ?? undefined,
            }),
            recognition.id,
          ),
        );
        break;
      }
      case "update_project": {
        const input = z
          .object({ id: z.uuid(), values: projectSchema })
          .parse(approval.payload);
        actionError(await saveProject(input.values, input.id));
        break;
      }
      case "update_recognition": {
        const input = z
          .object({ id: z.uuid(), values: recognitionSchema })
          .parse(approval.payload);
        actionError(await saveRecognition(input.values, input.id));
        break;
      }
      case "update_post": {
        const input = proposedPostSchema.parse(approval.payload);
        actionError(
          await savePost(
            {
              title: input.title,
              slug: input.slug,
              bodyMarkdown: input.bodyMarkdown,
              publishedAt: new Date(input.publishedAt),
              links: input.links,
            },
            input.id,
          ),
        );
        break;
      }
      case "create_project_draft": {
        actionError(
          await saveProject(
            projectSchema.parse(approval.payload),
            undefined,
            false,
          ),
        );
        break;
      }
      case "create_recognition_draft": {
        actionError(
          await saveRecognition(
            recognitionSchema.parse(approval.payload),
            undefined,
            false,
          ),
        );
        break;
      }
      case "create_post_draft": {
        const input = proposedPostSchema
          .omit({ id: true, slug: true })
          .parse(approval.payload);
        actionError(
          await savePost(
            {
              ...input,
              slug: uniqueSlug(
                slugifyTitle(input.title),
                await getTakenSlugs(),
              ),
              publishedAt: new Date(input.publishedAt),
            },
            undefined,
            false,
          ),
        );
        break;
      }
      case "create_tech_stack_draft": {
        actionError(
          await saveTechStackItem(techStackItemSchema.parse(approval.payload)),
        );
        break;
      }
      case "update_tech_stack": {
        const input = z
          .object({ id: z.uuid(), values: techStackItemSchema })
          .parse(approval.payload);
        actionError(await saveTechStackItem(input.values, input.id));
        break;
      }
      case "delete_tech_stack": {
        const input = z.object({ id: z.uuid() }).parse(approval.payload);
        actionError(await deleteTechStackItem(input.id));
        break;
      }
      case "reorder_tech_stack": {
        const input = z
          .object({ order: techStackOrderSchema })
          .parse(approval.payload);
        actionError(await reorderTechStack(input.order));
        break;
      }
      default:
        throw new Error("Unknown approval action.");
    }

    return resolveApproval({
      id,
      status: "executed",
      note: "Approved and applied.",
    });
  } catch (error) {
    await cleanupRejectedUpload(approval);
    await resolveApproval({ id, status: "failed", note: String(error) });
    throw error;
  }
}

export async function decideAssistantApproval(
  id: string,
  decision: "approve" | "reject",
) {
  await requireAdmin();
  return executeApprovalDecision(id, decision);
}

export async function decideMcpApproval(
  id: string,
  decision: "approve" | "reject",
  threadId: string,
) {
  const [approval] = await getDb()
    .select({ threadId: agentApprovals.threadId })
    .from(agentApprovals)
    .where(eq(agentApprovals.id, id))
    .limit(1);
  if (!approval || approval.threadId !== threadId) {
    throw new Error("This proposal does not belong to the MCP connection.");
  }
  return runAsMcpMutation(() => executeApprovalDecision(id, decision));
}
