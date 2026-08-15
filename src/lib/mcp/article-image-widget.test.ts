import { describe, expect, it } from "vitest";
import {
  ARTICLE_IMAGE_WIDGET_MIME_TYPE,
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
    expect(articleImageWidgetToolDefinition()).toMatchObject({
      inputSchema: {},
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

    expect(html).toContain(
      'accept="image/png,image/jpeg,image/webp,image/gif"',
    );
    expect(html).toContain("const MAX_BYTES = 8 * 1024 * 1024");
    expect(html).toContain('maxlength="180"');
    expect(html).toContain("library: false");
    expect(html).toContain("selectFiles");
    expect(html).toContain("getFileDownloadUrl");
    expect(html).toContain('callTool("store_article_image"');
    expect(html).toContain("download_url: downloadUrl");
    expect(html).toContain("file_id: selected.fileId");
    expect(html).toContain("mime_type: selected.mimeType");
    expect(html).toContain("file_name: selected.fileName");
    expect(html).toContain("attach the image in the conversation");
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html).not.toContain("r2.cloudflarestorage.com");
  });
});
