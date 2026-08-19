import { createHash } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it } from "vitest";
import {
  articleImageInputSchema,
  articleImageMarkdown,
  articleImageOutputSchema,
  articleImageToolDefinition,
  articleImageToolMeta,
  redactArticleImageAuditArgs,
} from "@/lib/mcp/article-image-contract";

const validInput = {
  file: {
    download_url: "https://files.example.test/generated/image.png?token=secret",
    file_id: "file-sensitive-123",
    mime_type: "image/png",
    file_name: "architecture.png",
  },
  altText: "Bippy architecture",
};

describe("MCP article image contract", () => {
  it("accepts the documented file object and bounded alt text", () => {
    expect(articleImageInputSchema.parse(validInput)).toEqual(validInput);
    expect(() =>
      articleImageInputSchema.parse({ ...validInput, altText: " " }),
    ).toThrow();
    expect(() =>
      articleImageInputSchema.parse({
        file: "/mnt/data/ai-native-cms-hero.png",
        altText: "AI-native CMS hero",
      }),
    ).toThrow();
    expect(() =>
      articleImageInputSchema.parse({
        ...validInput,
        altText: "x".repeat(181),
      }),
    ).toThrow();
  });

  it("declares the OpenAI file parameter beside OAuth security", () => {
    expect(articleImageToolMeta("portfolio:draft")).toEqual({
      _meta: {
        securitySchemes: [{ type: "oauth2", scopes: ["portfolio:draft"] }],
        "openai/fileParams": ["file"],
      },
    });
  });

  it("describes a mutating, non-destructive, open-world file tool", () => {
    const definition = articleImageToolDefinition();
    expect(
      definition.inputSchema.file.safeParse("/mnt/data/ai-native-cms-hero.png")
        .success,
    ).toBe(true);
    expect(definition.inputSchema.altText).toBe(
      articleImageInputSchema.shape.altText,
    );
    expect(definition.outputSchema).toBe(articleImageOutputSchema.shape);
    expect(definition._meta).toEqual({
      securitySchemes: [{ type: "oauth2", scopes: ["portfolio:draft"] }],
      "openai/fileParams": ["file"],
      ui: { visibility: ["model", "app"] },
      "openai/widgetAccessible": true,
    });
    expect(definition.annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: true,
    });
  });

  it("advertises the managed image result returned to MCP clients", () => {
    const key = `posts/2026/${"a".repeat(48)}.png`;
    const mediaPath = `/media/${key}`;
    expect(
      articleImageOutputSchema.parse({
        key,
        mediaPath,
        contentType: "image/png",
        size: 5_730,
        markdown: `![AI-native CMS hero](${mediaPath})`,
      }),
    ).toEqual({
      key,
      mediaPath,
      contentType: "image/png",
      size: 5_730,
      markdown: `![AI-native CMS hero](${mediaPath})`,
    });
  });

  it("serializes a ChatGPT-compatible file parameter in tools/list", async () => {
    const server = new McpServer({ name: "contract-test", version: "1.0.0" });
    server.registerTool(
      "store_article_image",
      articleImageToolDefinition(),
      async () => ({
        content: [{ type: "text", text: "stored" }],
        structuredContent: {
          key: `posts/2026/${"a".repeat(48)}.png`,
          mediaPath: `/media/posts/2026/${"a".repeat(48)}.png`,
          contentType: "image/png",
          size: 1,
          markdown: "![Image](/media/example.png)",
        },
      }),
    );
    const client = new Client({ name: "contract-test", version: "1.0.0" });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);
      const listed = await client.listTools();
      const tool = listed.tools.find(
        ({ name }) => name === "store_article_image",
      );

      expect(tool).toBeDefined();
      expect(tool?.inputSchema).toMatchObject({
        type: "object",
        properties: { file: {}, altText: { type: "string" } },
        required: ["file", "altText"],
      });
      expect(tool?.outputSchema).toMatchObject({
        type: "object",
        properties: {
          key: { type: "string" },
          mediaPath: { type: "string" },
          contentType: { type: "string" },
          size: { type: "integer" },
          markdown: { type: "string" },
        },
      });
      expect(tool?._meta?.["openai/fileParams"]).toEqual(["file"]);
    } finally {
      await client.close();
      await server.close();
    }
  });

  it("redacts the temporary URL and hashes the file id", () => {
    const audit = redactArticleImageAuditArgs(validInput);
    const serialized = JSON.stringify(audit);

    expect(serialized).not.toContain(validInput.file.download_url);
    expect(serialized).not.toContain(validInput.file.file_id);
    expect(audit).toEqual({
      altText: validInput.altText,
      fileName: validInput.file.file_name,
      declaredMimeType: validInput.file.mime_type,
      fileIdSha256: createHash("sha256")
        .update(validInput.file.file_id)
        .digest("hex"),
    });
  });

  it("escapes Markdown alt text without changing the managed path", () => {
    expect(
      articleImageMarkdown(
        "A [draft] \\ view",
        "/media/posts/2026/example.png",
      ),
    ).toBe("![A \\[draft\\] \\\\ view](/media/posts/2026/example.png)");
  });
});
