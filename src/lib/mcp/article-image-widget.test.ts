import { describe, expect, it } from "vitest";
import {
  ARTICLE_IMAGE_WIDGET_MIME_TYPE,
  ARTICLE_IMAGE_WIDGET_ALLOWED_TYPES,
  ARTICLE_IMAGE_WIDGET_MAX_BYTES,
  ARTICLE_IMAGE_WIDGET_URI,
  articleImageWidgetHtml,
  articleImageWidgetResource,
  articleImageWidgetToolDefinition,
} from "@/lib/mcp/article-image-widget";

describe("MCP article image uploader widget", () => {
  it("exposes a versioned MCP Apps resource with a closed CSP", () => {
    expect(ARTICLE_IMAGE_WIDGET_URI).toBe(
      "ui://ameenfolio/article-image-uploader-v1.html",
    );
    expect(ARTICLE_IMAGE_WIDGET_MIME_TYPE).toBe("text/html;profile=mcp-app");

    const resource = articleImageWidgetResource();
    expect(resource).toMatchObject({
      uri: ARTICLE_IMAGE_WIDGET_URI,
      mimeType: ARTICLE_IMAGE_WIDGET_MIME_TYPE,
      _meta: {
        ui: {
          prefersBorder: true,
          csp: { connectDomains: [], resourceDomains: [] },
        },
        "openai/widgetPrefersBorder": true,
        "openai/widgetCSP": {
          connect_domains: [],
          resource_domains: [],
        },
      },
    });
  });

  it("binds a read-only render tool to the widget resource", () => {
    const definition = articleImageWidgetToolDefinition();
    expect(definition.inputSchema).toEqual({});
    expect(definition).toMatchObject({
      _meta: {
        securitySchemes: [{ type: "oauth2", scopes: ["portfolio:draft"] }],
        ui: { resourceUri: ARTICLE_IMAGE_WIDGET_URI },
        "openai/outputTemplate": ARTICLE_IMAGE_WIDGET_URI,
        "openai/widgetAccessible": true,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
        idempotentHint: true,
      },
    });
  });

  it("contains the complete secure fallback upload workflow", () => {
    const html = articleImageWidgetHtml();

    expect(ARTICLE_IMAGE_WIDGET_MAX_BYTES).toBe(8 * 1024 * 1024);
    expect(ARTICLE_IMAGE_WIDGET_ALLOWED_TYPES).toEqual([
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
    ]);
    expect(html).toContain(`"maxBytes":${ARTICLE_IMAGE_WIDGET_MAX_BYTES}`);
    for (const contentType of ARTICLE_IMAGE_WIDGET_ALLOWED_TYPES) {
      expect(html).toContain(contentType);
    }
    expect(html).toContain('maxlength="180"');
    expect(html).toContain("library: false");
    expect(html).toContain("selectFiles");
    expect(html).toContain("getFileDownloadUrl");
    expect(html).toContain('callTool("store_article_image"');
    expect(html).toContain("attach the image in the conversation");
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html).not.toContain("r2.cloudflarestorage.com");
  });
});
