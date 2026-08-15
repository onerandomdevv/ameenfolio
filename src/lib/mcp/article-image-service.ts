import {
  articleImageInputSchema,
  articleImageMarkdown,
  type ArticleImageInput,
} from "@/lib/mcp/article-image-contract";

type StoredArticleImage = {
  key: string;
  mediaPath: string;
};

type TrackedArticleImage = {
  objectKey: string;
  contentType: string;
  byteSize: number;
  clientId: string;
};

export type ArticleImageServiceDependencies = {
  download: (input: {
    downloadUrl: string;
    declaredMimeType?: string;
  }) => Promise<{ bytes: Uint8Array; contentType: string }>;
  putObject: (
    resourceType: "post",
    contentType: string,
    bytes: Uint8Array,
  ) => Promise<StoredArticleImage>;
  insertUpload: (values: TrackedArticleImage) => Promise<void>;
  deleteObject: (key: string) => Promise<void>;
  log: (
    level: "error",
    event: string,
    details: Record<string, unknown>,
  ) => void;
};

export async function storeArticleImage(
  rawInput: ArticleImageInput,
  clientId: string,
  dependencies: ArticleImageServiceDependencies,
) {
  const input = articleImageInputSchema.parse(rawInput);
  const downloaded = await dependencies.download({
    downloadUrl: input.file.download_url,
    declaredMimeType: input.file.mime_type,
  });
  const stored = await dependencies.putObject(
    "post",
    downloaded.contentType,
    downloaded.bytes,
  );

  try {
    await dependencies.insertUpload({
      objectKey: stored.key,
      contentType: downloaded.contentType,
      byteSize: downloaded.bytes.byteLength,
      clientId,
    });
  } catch (error) {
    dependencies.log("error", "mcp.article_image_tracking_failed", {
      key: stored.key,
      error: String(error),
    });
    try {
      await dependencies.deleteObject(stored.key);
    } catch (cleanupError) {
      dependencies.log("error", "mcp.article_image_cleanup_failed", {
        key: stored.key,
        error: String(cleanupError),
      });
    }
    throw new Error("The article image was stored but could not be tracked.");
  }

  return {
    key: stored.key,
    mediaPath: stored.mediaPath,
    contentType: downloaded.contentType,
    size: downloaded.bytes.byteLength,
    markdown: articleImageMarkdown(input.altText, stored.mediaPath),
  };
}
