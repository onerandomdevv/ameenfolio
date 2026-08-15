export const ARTICLE_IMAGE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

type ExpiredArticleImage = {
  id: string;
  objectKey: string;
};

export type ArticleImageCleanupDependencies = {
  selectExpired: (cutoff: Date) => Promise<ExpiredArticleImage[]>;
  claimForDeletion: (upload: ExpiredArticleImage) => Promise<boolean>;
  deleteObject: (key: string) => Promise<void>;
  markDeleted: (id: string) => Promise<void>;
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
  const uploads = await dependencies.selectExpired(cutoff);
  const result = {
    scanned: uploads.length,
    deleted: 0,
    retained: 0,
    failed: 0,
  };

  for (const upload of uploads) {
    if (!(await dependencies.claimForDeletion(upload))) {
      result.retained += 1;
      continue;
    }

    try {
      await dependencies.deleteObject(upload.objectKey);
      await dependencies.markDeleted(upload.id);
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
