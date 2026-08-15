import { describe, expect, it, vi } from "vitest";
import {
  ARTICLE_IMAGE_RETENTION_MS,
  cleanupExpiredArticleImages,
  type ArticleImageCleanupDependencies,
} from "@/lib/mcp/article-image-cleanup";

const now = new Date("2026-08-15T12:00:00.000Z");
const upload = {
  id: "upload-1",
  objectKey: `posts/2026/${"a".repeat(48)}.png`,
};

function dependencies(claimed = true): ArticleImageCleanupDependencies {
  return {
    selectExpired: vi.fn(async () => [upload]),
    claimForDeletion: vi.fn(async () => claimed),
    deleteObject: vi.fn(async () => undefined),
    markDeleted: vi.fn(async () => undefined),
    log: vi.fn(),
  };
}

describe("MCP article image cleanup", () => {
  it("uses an exact seven-day cutoff", async () => {
    const deps = dependencies();
    await cleanupExpiredArticleImages(now, deps);
    expect(deps.selectExpired).toHaveBeenCalledWith(
      new Date(now.getTime() - ARTICLE_IMAGE_RETENTION_MS),
    );
    expect(ARTICLE_IMAGE_RETENTION_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("retains images referenced by any saved draft or published post", async () => {
    const deps = dependencies(false);

    await expect(cleanupExpiredArticleImages(now, deps)).resolves.toEqual({
      scanned: 1,
      deleted: 0,
      retained: 1,
      failed: 0,
    });
    expect(deps.deleteObject).not.toHaveBeenCalled();
    expect(deps.markDeleted).not.toHaveBeenCalled();
  });

  it("does not treat an unsaved pending proposal as a retained reference", async () => {
    const deps = dependencies(true);

    await expect(cleanupExpiredArticleImages(now, deps)).resolves.toEqual({
      scanned: 1,
      deleted: 1,
      retained: 0,
      failed: 0,
    });
    expect(deps.deleteObject).toHaveBeenCalledWith(upload.objectKey);
    expect(deps.claimForDeletion).toHaveBeenCalledWith(upload);
    expect(deps.markDeleted).toHaveBeenCalledWith(upload.id);
  });

  it("keeps the tracking row when R2 deletion fails so cleanup can retry", async () => {
    const deps = dependencies();
    vi.mocked(deps.deleteObject).mockRejectedValue(new Error("R2 down"));

    await expect(cleanupExpiredArticleImages(now, deps)).resolves.toEqual({
      scanned: 1,
      deleted: 0,
      retained: 0,
      failed: 1,
    });
    expect(deps.markDeleted).not.toHaveBeenCalled();
    expect(deps.log).toHaveBeenCalledWith(
      "error",
      "mcp.article_image_expiry_failed",
      { key: upload.objectKey, error: "Error: R2 down" },
    );
  });
});
