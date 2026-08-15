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
  const key = `posts/2026/${"a".repeat(48)}.png`;
  return {
    download: vi.fn(async () => ({
      bytes: Buffer.from([1, 2, 3]),
      contentType: "image/png" as const,
    })),
    reserveUpload: vi.fn(async () => ({
      id: "upload-1",
      key,
      mediaPath: `/media/${key}`,
    })),
    putObject: vi.fn(async () => undefined),
    markReady: vi.fn(async () => undefined),
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
    expect(deps.reserveUpload).toHaveBeenCalledWith({
      contentType: "image/png",
      byteSize: 3,
      clientId: "client-1",
    });
    expect(deps.putObject).toHaveBeenCalledWith(
      `posts/2026/${"a".repeat(48)}.png`,
      "image/png",
      Buffer.from([1, 2, 3]),
    );
    expect(deps.markReady).toHaveBeenCalledWith("upload-1");
    expect(
      vi.mocked(deps.reserveUpload).mock.invocationCallOrder[0],
    ).toBeLessThan(vi.mocked(deps.putObject).mock.invocationCallOrder[0]);
  });

  it("does not write to R2 when the durable reservation fails", async () => {
    const deps = dependencies();
    vi.mocked(deps.reserveUpload).mockRejectedValue(new Error("database down"));

    await expect(storeArticleImage(input, "client-1", deps)).rejects.toThrow(
      "could not be reserved",
    );
    expect(deps.putObject).not.toHaveBeenCalled();
    expect(deps.log).toHaveBeenCalledWith(
      "error",
      "mcp.article_image_reservation_failed",
      expect.any(Object),
    );
    expect(JSON.stringify(vi.mocked(deps.log).mock.calls)).not.toContain(
      input.file.download_url,
    );
    expect(JSON.stringify(vi.mocked(deps.log).mock.calls)).not.toContain(
      input.file.file_id,
    );
  });

  it("leaves the durable pending record available when finalization fails", async () => {
    const deps = dependencies();
    vi.mocked(deps.markReady).mockRejectedValue(new Error("database down"));

    await expect(storeArticleImage(input, "client-1", deps)).rejects.toThrow(
      "could not be finalized",
    );
    expect(deps.log).toHaveBeenCalledWith(
      "error",
      "mcp.article_image_finalization_failed",
      expect.objectContaining({
        key: `posts/2026/${"a".repeat(48)}.png`,
      }),
    );
  });
});
