import {
  articleImageInputSchema,
  articleImageMarkdown,
  type ArticleImageInput,
} from "@/lib/mcp/article-image-contract";

type StoredArticleImage = {
  id: string;
  key: string;
  mediaPath: string;
};

type ArticleImageReservation = {
  contentType: string;
  byteSize: number;
  clientId: string;
};

export type ArticleImageServiceDependencies = {
  download: (input: {
    downloadUrl: string;
    declaredMimeType?: string;
  }) => Promise<{ bytes: Uint8Array; contentType: string }>;
  reserveUpload: (
    values: ArticleImageReservation,
  ) => Promise<StoredArticleImage>;
  putObject: (
    key: string,
    contentType: string,
    bytes: Uint8Array,
  ) => Promise<void>;
  markReady: (id: string) => Promise<void>;
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
  let stored: StoredArticleImage;

  try {
    stored = await dependencies.reserveUpload({
      contentType: downloaded.contentType,
      byteSize: downloaded.bytes.byteLength,
      clientId,
    });
  } catch (error) {
    dependencies.log("error", "mcp.article_image_reservation_failed", {
      error: String(error),
    });
    throw new Error("The article image could not be reserved for storage.");
  }

  try {
    await dependencies.putObject(
      stored.key,
      downloaded.contentType,
      downloaded.bytes,
    );
    await dependencies.markReady(stored.id);
  } catch (error) {
    dependencies.log("error", "mcp.article_image_finalization_failed", {
      key: stored.key,
      error: String(error),
    });
    throw new Error("The article image could not be finalized for use.");
  }

  return {
    key: stored.key,
    mediaPath: stored.mediaPath,
    contentType: downloaded.contentType,
    size: downloaded.bytes.byteLength,
    markdown: articleImageMarkdown(input.altText, stored.mediaPath),
  };
}
