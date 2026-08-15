export const ARTICLE_IMAGE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

type ExpiredArticleImage = {
  id: string;
  objectKey: string;
};

export type ArticleImageCleanupDependencies = {
  selectExpired: (cutoff: Date) => Promise<ExpiredArticleImage[]>;
  listSavedPostMarkdown: () => Promise<string[]>;
  deleteObject: (key: string) => Promise<void>;
  deleteRow: (id: string) => Promise<void>;
  log: (
    level: "error",
    event: string,
    details: Record<string, unknown>,
  ) => void;
};

export async function cleanupExpiredArticleImages(
  now: Date,
  dependencies: ArticleImageCleanupDependencies,
) {
  const cutoff = new Date(now.getTime() - ARTICLE_IMAGE_RETENTION_MS);
  const [uploads, markdownBodies] = await Promise.all([
    dependencies.selectExpired(cutoff),
    dependencies.listSavedPostMarkdown(),
  ]);
  const result = {
    scanned: uploads.length,
    deleted: 0,
    retained: 0,
    failed: 0,
  };

  for (const upload of uploads) {
    const mediaPath = `/media/${upload.objectKey}`;
    if (markdownBodies.some((body) => body.includes(mediaPath))) {
      result.retained += 1;
      continue;
    }

    try {
      await dependencies.deleteObject(upload.objectKey);
      await dependencies.deleteRow(upload.id);
      result.deleted += 1;
    } catch (error) {
      result.failed += 1;
      dependencies.log("error", "mcp.article_image_expiry_failed", {
        key: upload.objectKey,
        error: String(error),
      });
    }
  }

  return result;
}
