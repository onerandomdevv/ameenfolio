import { createHash } from "node:crypto";
import { z } from "zod";

export type PortfolioMcpScope =
  | "portfolio:read"
  | "portfolio:draft"
  | "portfolio:propose";

export const articleImageInputSchema = z.object({
  file: z.object({
    download_url: z.url(),
    file_id: z.string().min(1),
    mime_type: z.string().optional(),
    file_name: z.string().max(180).optional(),
  }),
  altText: z.string().trim().min(1).max(180),
});

export type ArticleImageInput = z.infer<typeof articleImageInputSchema>;

export const articleImageOutputSchema = z.object({
  key: z.string().regex(/^posts\/\d{4}\/[a-f0-9]{48}\.(png|jpg|webp|gif)$/),
  mediaPath: z
    .string()
    .regex(/^\/media\/posts\/\d{4}\/[a-f0-9]{48}\.(png|jpg|webp|gif)$/),
  contentType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]),
  size: z
    .number()
    .int()
    .positive()
    .max(8 * 1024 * 1024),
  markdown: z.string().min(1),
});

const articleImageToolInputSchema = {
  // ChatGPT replaces a generated/local file reference with its temporary file
  // object before invoking the tool. Keep this manifest boundary permissive and
  // validate the transformed value with articleImageInputSchema in the handler.
  file: z.any(),
  altText: articleImageInputSchema.shape.altText,
};

export function articleImageToolMeta(scope: PortfolioMcpScope) {
  return {
    _meta: {
      securitySchemes: [{ type: "oauth2" as const, scopes: [scope] }],
      "openai/fileParams": ["file"],
    },
  };
}

export function articleImageToolDefinition() {
  const { _meta } = articleImageToolMeta("portfolio:draft");
  return {
    title: "Store article image",
    description:
      "Use this when a generated or selected image must be stored for a writing draft. It returns the managed media path and ready-to-insert Markdown for prepare_post_draft or prepare_post_update.",
    inputSchema: articleImageToolInputSchema,
    outputSchema: articleImageOutputSchema.shape,
    _meta: {
      ..._meta,
      ui: { visibility: ["model", "app"] },
      "openai/widgetAccessible": true,
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: true,
    },
  };
}

export function redactArticleImageAuditArgs(input: ArticleImageInput) {
  return {
    altText: input.altText,
    fileName: input.file.file_name,
    declaredMimeType: input.file.mime_type,
    fileIdSha256: createHash("sha256").update(input.file.file_id).digest("hex"),
  };
}

function escapeMarkdownAltText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]");
}

export function articleImageMarkdown(altText: string, mediaPath: string) {
  return `![${escapeMarkdownAltText(altText)}](${mediaPath})`;
}
