import { describe, expect, it, vi } from "vitest";
import {
  assertPublicAddresses,
  createPinnedLookup,
  detectArticleImage,
  downloadRemoteArticleImage,
  type RemoteImageDependencies,
  RemoteImageError,
  validateRemoteImageUrl,
} from "@/lib/storage/remote-image";

const png = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x00, 0xff, 0xd9]);
const gif = Buffer.concat([
  Buffer.from("GIF89a", "ascii"),
  Buffer.from([0x3b]),
]);
const webp = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x04, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

describe("remote article image validation", () => {
  it.each([
    [png, { contentType: "image/png", extension: ".png" }],
    [jpeg, { contentType: "image/jpeg", extension: ".jpg" }],
    [gif, { contentType: "image/gif", extension: ".gif" }],
    [webp, { contentType: "image/webp", extension: ".webp" }],
  ])("detects an allowed binary image", (bytes, expected) => {
    expect(detectArticleImage(bytes)).toEqual(expected);
  });

  it.each([
    Buffer.alloc(0),
    Buffer.from("<svg><script>alert(1)</script></svg>"),
    Buffer.from("<html>not an image</html>"),
    Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    Buffer.from([0x7f, 0x45, 0x4c, 0x46]),
    png.subarray(0, 8),
    jpeg.subarray(0, 4),
  ])("rejects empty, unsafe, or malformed bytes", (bytes) => {
    expect(() => detectArticleImage(bytes)).toThrow(/valid image/i);
  });

  it("accepts only credential-free HTTPS URLs", () => {
    expect(
      validateRemoteImageUrl("https://cdn.example.test/image.png").href,
    ).toBe("https://cdn.example.test/image.png");
    expect(() =>
      validateRemoteImageUrl("http://cdn.example.test/image.png"),
    ).toThrow(/https/i);
    expect(() =>
      validateRemoteImageUrl("https://user:pass@cdn.example.test/image.png"),
    ).toThrow(/credentials/i);
    expect(() => validateRemoteImageUrl("not a url")).toThrow(/url/i);
  });

  it.each([
    ["0.0.0.0", 4],
    ["10.1.2.3", 4],
    ["100.64.0.1", 4],
    ["127.0.0.1", 4],
    ["169.254.1.1", 4],
    ["172.16.0.1", 4],
    ["192.168.1.1", 4],
    ["192.0.2.1", 4],
    ["198.18.0.1", 4],
    ["198.51.100.1", 4],
    ["203.0.113.1", 4],
    ["224.0.0.1", 4],
    ["240.0.0.1", 4],
    ["::", 6],
    ["::1", 6],
    ["::ffff:127.0.0.1", 6],
    ["fc00::1", 6],
    ["fe80::1", 6],
    ["ff00::1", 6],
    ["2001::1", 6],
    ["2001:db8::1", 6],
    ["2002:7f00:1::1", 6],
    ["3fff::1", 6],
  ] as const)("rejects non-public address %s", (address, family) => {
    expect(() => assertPublicAddresses([{ address, family }])).toThrow(
      /public/i,
    );
  });

  it("accepts public addresses only when every DNS answer is public", () => {
    expect(() =>
      assertPublicAddresses([
        { address: "8.8.8.8", family: 4 },
        { address: "2606:4700:4700::1111", family: 6 },
      ]),
    ).not.toThrow();
    expect(() =>
      assertPublicAddresses([
        { address: "8.8.8.8", family: 4 },
        { address: "127.0.0.1", family: 4 },
      ]),
    ).toThrow(/public/i);
  });
});

async function* chunks(...values: Uint8Array[]) {
  yield* values;
}

function dependencies(
  responses: Array<{
    statusCode: number;
    headers?: Record<string, string | undefined>;
    body?: AsyncIterable<Uint8Array>;
  }>,
  resolved: Record<string, Array<{ address: string; family: 4 | 6 }>> = {},
) {
  const resolveHost = vi.fn(async (hostname: string) =>
    Promise.resolve(
      resolved[hostname] ?? [{ address: "8.8.8.8", family: 4 as const }],
    ),
  );
  const request = vi.fn(async () => {
    const response = responses.shift();
    if (!response) throw new Error("Unexpected request");
    return {
      statusCode: response.statusCode,
      headers: response.headers ?? {},
      body: response.body ?? chunks(),
      destroy: vi.fn(),
    };
  });
  return { resolveHost, request } satisfies RemoteImageDependencies;
}

describe("remote article image downloader", () => {
  it("returns the pinned address in Node's all-address lookup mode", () => {
    const lookup = createPinnedLookup({ address: "8.8.8.8", family: 4 });
    const callback = vi.fn();

    lookup("cdn.example.test", { all: true }, callback);

    expect(callback).toHaveBeenCalledWith(null, [
      { address: "8.8.8.8", family: 4 },
    ]);
  });

  it("downloads through a pinned public address and validates MIME", async () => {
    const deps = dependencies([
      {
        statusCode: 200,
        headers: {
          "content-length": String(png.byteLength),
          "content-type": "image/png; charset=binary",
        },
        body: chunks(png.subarray(0, 8), png.subarray(8)),
      },
    ]);

    await expect(
      downloadRemoteArticleImage(
        {
          downloadUrl: "https://cdn.example.test/image.png",
          declaredMimeType: "image/png",
        },
        deps,
      ),
    ).resolves.toEqual({ bytes: png, contentType: "image/png" });
    expect(deps.request).toHaveBeenCalledWith(
      expect.objectContaining({ hostname: "cdn.example.test" }),
      { address: "8.8.8.8", family: 4 },
      10_000,
    );
  });

  it("validates every redirect and stops before requesting a private hop", async () => {
    const deps = dependencies(
      [
        {
          statusCode: 302,
          headers: { location: "https://private.example.test/image.png" },
        },
      ],
      {
        "private.example.test": [{ address: "127.0.0.1", family: 4 }],
      },
    );

    await expect(
      downloadRemoteArticleImage(
        { downloadUrl: "https://public.example.test/image.png" },
        deps,
      ),
    ).rejects.toMatchObject({ code: "unsafe_source" });
    expect(deps.request).toHaveBeenCalledTimes(1);
    expect(deps.resolveHost).toHaveBeenCalledTimes(2);
  });

  it("rejects more than three redirects", async () => {
    const deps = dependencies(
      [1, 2, 3, 4].map((index) => ({
        statusCode: 302,
        headers: { location: `https://cdn${index}.example.test/image.png` },
      })),
    );
    await expect(
      downloadRemoteArticleImage(
        { downloadUrl: "https://cdn0.example.test/image.png" },
        deps,
      ),
    ).rejects.toMatchObject({ code: "download_failed" });
    expect(deps.request).toHaveBeenCalledTimes(4);
  });

  it("rejects a redirect without a Location header", async () => {
    const deps = dependencies([{ statusCode: 302 }]);
    await expect(
      downloadRemoteArticleImage(
        { downloadUrl: "https://cdn.example.test/image.png" },
        deps,
      ),
    ).rejects.toThrow("redirect without a Location header");
  });

  it("rejects oversized declared and streamed bodies", async () => {
    const declared = dependencies([
      {
        statusCode: 200,
        headers: { "content-length": String(8 * 1024 * 1024 + 1) },
      },
    ]);
    await expect(
      downloadRemoteArticleImage(
        { downloadUrl: "https://cdn.example.test/large.png" },
        declared,
      ),
    ).rejects.toMatchObject({ code: "too_large" });

    const streamed = dependencies([
      {
        statusCode: 200,
        body: chunks(Buffer.alloc(8 * 1024 * 1024), Buffer.from([0x00])),
      },
    ]);
    await expect(
      downloadRemoteArticleImage(
        { downloadUrl: "https://cdn.example.test/chunked.png" },
        streamed,
      ),
    ).rejects.toMatchObject({ code: "too_large" });
  });

  it.each(["abc", "-1"])(
    "rejects invalid declared content length %s",
    async (contentLength) => {
      const deps = dependencies([
        { statusCode: 200, headers: { "content-length": contentLength } },
      ]);
      await expect(
        downloadRemoteArticleImage(
          { downloadUrl: "https://cdn.example.test/image.png" },
          deps,
        ),
      ).rejects.toThrow("invalid content length");
    },
  );

  it("rejects timeout, encoded, failed, and MIME-mismatched responses", async () => {
    const timeout = dependencies([]);
    timeout.request.mockRejectedValue(
      new RemoteImageError("timeout", "The image download timed out."),
    );
    await expect(
      downloadRemoteArticleImage(
        { downloadUrl: "https://cdn.example.test/image.png" },
        timeout,
      ),
    ).rejects.toMatchObject({ code: "timeout" });

    for (const response of [
      { statusCode: 404, headers: {}, body: chunks(png) },
      {
        statusCode: 200,
        headers: { "content-encoding": "gzip" },
        body: chunks(png),
      },
      {
        statusCode: 200,
        headers: { "content-type": "image/jpeg" },
        body: chunks(png),
      },
    ]) {
      await expect(
        downloadRemoteArticleImage(
          { downloadUrl: "https://cdn.example.test/image.png" },
          dependencies([response]),
        ),
      ).rejects.toBeInstanceOf(RemoteImageError);
    }

    await expect(
      downloadRemoteArticleImage(
        {
          downloadUrl: "https://cdn.example.test/image.png",
          declaredMimeType: "image/jpeg",
        },
        dependencies([{ statusCode: 200, body: chunks(png) }]),
      ),
    ).rejects.toMatchObject({ code: "mime_mismatch" });
  });
});
