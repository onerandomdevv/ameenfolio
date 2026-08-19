# MCP Article Image Uploader Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a compact ChatGPT file-picker widget that sends a temporary image file through the existing secure `store_article_image` MCP tool and displays managed Markdown.

**Architecture:** A pure widget-contract module owns the versioned UI URI, MCP metadata, and self-contained HTML. `createBippyMcpServer` registers one render-only tool and resource, while the existing storage tool is made app-callable without changing its authorization or ingestion logic.

**Tech Stack:** TypeScript, MCP SDK, MCP Apps HTML resource, ChatGPT `window.openai` file extensions, Vitest, Next.js 16.

## Global Constraints

- Use `ui://ameenfolio/article-image-uploader-v1.html` and `text/html;profile=mcp-app`.
- Do not add a frontend framework, external scripts, direct R2 access, or a new dependency.
- Upload with `window.openai.uploadFile(file, { library: false })`; never save fallback uploads to the ChatGPT library.
- Accept PNG, JPEG, WebP, and GIF up to 8 MB, require 1–180 characters of alt text, and repeat all validation server-side through `store_article_image`.
- Keep `store_article_image` available to both model and app while preserving `portfolio:draft` scope enforcement.
- Keep all existing non-UI MCP and signed-PUT flows working.

---

### Task 1: Widget contract and self-contained UI

**Files:**

- Create: `src/lib/mcp/article-image-widget.ts`
- Test: `src/lib/mcp/article-image-widget.test.ts`

**Interfaces:**

- Produces: `ARTICLE_IMAGE_WIDGET_URI`, `ARTICLE_IMAGE_WIDGET_MIME_TYPE`, `articleImageWidgetResource()`, `articleImageWidgetToolDefinition()`, and `articleImageWidgetHtml()`.
- Consumes: existing OAuth metadata shape and the `store_article_image` tool name.

- [x] **Step 1: Write failing tests**

Assert the versioned URI, MCP Apps MIME type, empty CSP origins, render-tool annotations, supported MIME/size limits, `library: false`, snake-case file payload, `store_article_image` call, required alt text, feature detection, fallback copy, and absence of external scripts/R2 URLs.

- [x] **Step 2: Verify red**

Run: `npx vitest run src/lib/mcp/article-image-widget.test.ts`

Expected: module-not-found failure because the widget contract does not exist.

- [x] **Step 3: Implement the widget contract**

Return a self-contained accessible HTML document. A local file uses `uploadFile`, an existing ChatGPT file uses `selectFiles`, both obtain a URL through `getFileDownloadUrl`, and both call:

```ts
window.openai.callTool("store_article_image", {
  file: {
    download_url: downloadUrl,
    file_id: fileId,
    mime_type: mimeType,
    file_name: fileName,
  },
  altText,
});
```

- [x] **Step 4: Verify green**

Run: `npx vitest run src/lib/mcp/article-image-widget.test.ts`

### Task 2: Register the UI resource and render tool

**Files:**

- Modify: `src/lib/mcp/tools.ts`
- Modify: `src/lib/mcp/article-image-contract.ts`
- Modify: `src/lib/mcp/article-image-contract.test.ts`

**Interfaces:**

- `createBippyMcpServer` registers the resource and `open_article_image_uploader`.
- `store_article_image` advertises `_meta.ui.visibility: ["model", "app"]` and `openai/widgetAccessible: true`.

- [x] **Step 1: Add failing descriptor tests**

Assert app visibility is present alongside `openai/fileParams`, OAuth security, and existing annotations.

- [x] **Step 2: Verify red**

Run: `npx vitest run src/lib/mcp/article-image-contract.test.ts src/lib/mcp/article-image-widget.test.ts`

- [x] **Step 3: Register the resource and tool**

Register the HTML resource before tools. The render tool requires `portfolio:draft`, returns concise structured content, and does not audit a mutation because it only renders UI. Preserve independent scope enforcement on `store_article_image`.

- [x] **Step 4: Verify green and type compatibility**

Run: `npx vitest run src/lib/mcp/article-image-contract.test.ts src/lib/mcp/article-image-widget.test.ts`

Run: `npm run typecheck`

### Task 3: Documentation, final verification, and publication

**Files:**

- Modify: `docs/architecture.md`
- Modify: `docs/superpowers/plans/2026-08-15-mcp-article-image-uploader-widget.md`

**Interfaces:**

- Documents how ChatGPT opens the widget and how unsupported hosts fall back to conversational attachment.

- [x] **Step 1: Document the fallback flow**

Record the render tool, temporary non-library upload, secure ingestion reuse, and connector refresh requirement.

- [x] **Step 2: Run final checks**

Run: `npm run format:check`

Run: `npm run lint`

Run: `npm run typecheck`

Run: `npm test`

Run: `npm run build`

Run: `git diff --check`

- [x] **Step 3: Commit and publish**

Stage only the approved MCP image-ingestion and widget files, commit them, push `codex/mcp-article-image-ingestion`, and open a ready PR to `dev` with validation evidence and deployment instructions for migration `0036` plus connector refresh.
