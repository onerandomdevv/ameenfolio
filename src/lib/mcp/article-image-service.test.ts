import { describe, expect, it, vi } from "vitest";
import {
  storeArticleImage,
  type ArticleImageServiceDependencies,
} from "@/lib/mcp/article-image-service";

const input = {
  file: {
    download_url: "https://files.example.test/image.png?token=secret",
    file_id: "file-secret",
    mime_type: "image/png",
    file_name: "architecture.png",
  },
  altText: "Bippy [architecture]",
};

function dependencies(): ArticleImageServiceDependencies {
  return {
    download: vi.fn(async () => ({
      bytes: Buffer.from([1, 2, 3]),
      contentType: "image/png" as const,
    })),
    putObject: vi.fn(async () => ({
      key: `posts/2026/${"a".repeat(48)}.png`,
      mediaPath: `/media/posts/2026/${"a".repeat(48)}.png`,
    })),
    insertUpload: vi.fn(async () => undefined),
    deleteObject: vi.fn(async () => undefined),
    log: vi.fn(),
  };
}

describe("MCP article image storage", () => {
  it("stores validated bytes, tracks the client, and returns managed Markdown", async () => {
    const deps = dependencies();

    await expect(storeArticleImage(input, "client-1", deps)).resolves.toEqual({
      key: `posts/2026/${"a".repeat(48)}.png`,
      mediaPath: `/media/posts/2026/${"a".repeat(48)}.png`,
      contentType: "image/png",
      size: 3,
      markdown: `![Bippy \\[architecture\\]](/media/posts/2026/${"a".repeat(48)}.png)`,
    });
    expect(deps.download).toHaveBeenCalledWith({
      downloadUrl: input.file.download_url,
      declaredMimeType: input.file.mime_type,
    });
    expect(deps.putObject).toHaveBeenCalledWith(
      "post",
      "image/png",
      Buffer.from([1, 2, 3]),
    );
    expect(deps.insertUpload).toHaveBeenCalledWith({
      objectKey: `posts/2026/${"a".repeat(48)}.png`,
      contentType: "image/png",
      byteSize: 3,
      clientId: "client-1",
    });
  });

  it("deletes the R2 object when database tracking fails", async () => {
    const deps = dependencies();
    vi.mocked(deps.insertUpload).mockRejectedValue(new Error("database down"));

    await expect(storeArticleImage(input, "client-1", deps)).rejects.toThrow(
      "could not be tracked",
    );
    expect(deps.deleteObject).toHaveBeenCalledWith(
      `posts/2026/${"a".repeat(48)}.png`,
    );
    expect(deps.log).toHaveBeenCalledWith(
      "error",
      "mcp.article_image_tracking_failed",
      expect.objectContaining({
        key: `posts/2026/${"a".repeat(48)}.png`,
      }),
    );
    expect(JSON.stringify(vi.mocked(deps.log).mock.calls)).not.toContain(
      input.file.download_url,
    );
    expect(JSON.stringify(vi.mocked(deps.log).mock.calls)).not.toContain(
      input.file.file_id,
    );
  });

  it("logs a failed compensating delete without replacing the tracking error", async () => {
    const deps = dependencies();
    vi.mocked(deps.insertUpload).mockRejectedValue(new Error("database down"));
    vi.mocked(deps.deleteObject).mockRejectedValue(new Error("R2 down"));

    await expect(storeArticleImage(input, "client-1", deps)).rejects.toThrow(
      "could not be tracked",
    );
    expect(deps.log).toHaveBeenCalledWith(
      "error",
      "mcp.article_image_cleanup_failed",
      expect.objectContaining({
        key: `posts/2026/${"a".repeat(48)}.png`,
      }),
    );
  });
});
