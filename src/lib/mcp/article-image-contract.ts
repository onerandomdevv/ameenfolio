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
      "Store a generated or selected image privately for a writing draft and return ready-to-insert managed Markdown.",
    inputSchema: articleImageInputSchema.shape,
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
