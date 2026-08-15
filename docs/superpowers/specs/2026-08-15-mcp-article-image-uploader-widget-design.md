# MCP Article Image Uploader Widget Design

## Goal

Add a compact ChatGPT widget that lets the portfolio owner manually select an article image when ChatGPT cannot automatically pass a generated or attached file into `store_article_image`.

The widget is a fallback entry point only. The existing secure ingestion tool, private R2 storage, article proposal approval, public media gate, audit logging, and seven-day orphan cleanup remain authoritative.

## App Shape

This is a `vanilla-widget` extension to the existing authenticated MCP server. It uses a single inline HTML resource with no frontend framework, external scripts, fonts, stylesheets, or new runtime dependency.

The data and rendering paths remain decoupled:

- `open_article_image_uploader` is a render-only tool that opens the widget.
- `store_article_image` remains the only tool that downloads, validates, stores, tracks, and returns managed Markdown.

Clients without MCP UI support keep using `store_article_image` directly or the existing `request_media_upload` signed-PUT fallback.

## MCP Resource and Tool

Register the versioned resource URI:

`ui://ameenfolio/article-image-uploader-v1.html`

The resource uses `text/html;profile=mcp-app` and includes:

- `_meta.ui.prefersBorder: true`;
- `_meta.ui.csp` with empty `connectDomains` and `resourceDomains`, because all file and tool actions pass through the ChatGPT host bridge;
- the corresponding OpenAI compatibility metadata;
- a short widget description.

Register `open_article_image_uploader` with `portfolio:draft` scope. It has no input, is read-only, non-destructive, idempotent, and closed-world. Its descriptor links to the resource through `_meta.ui.resourceUri` and `_meta["openai/outputTemplate"]`.

The existing `store_article_image` descriptor becomes callable from the widget through `_meta.ui.visibility: ["model", "app"]` and the compatibility `openai/widgetAccessible` flag. Server-side scope enforcement remains unchanged.

## Widget Flow

The inline widget shows:

- a file picker for PNG, JPEG, WebP, or GIF;
- an optional “Choose from ChatGPT” action when `selectFiles` is available;
- a local preview for newly selected image files;
- a required alt-text input capped at 180 characters;
- a “Store image” action;
- concise pending, success, and error states;
- the returned managed Markdown after success.

For a local file, the widget:

1. validates the browser MIME, non-empty size, and 8 MB limit;
2. calls `window.openai.uploadFile(file, { library: false })`;
3. calls `window.openai.getFileDownloadUrl({ fileId })`;
4. calls `store_article_image` with the snake-case file object and alt text;
5. displays the returned managed key and Markdown.

For an existing ChatGPT file, the widget calls `selectFiles`, accepts the first supported image, requests its temporary download URL, and follows the same `store_article_image` call.

Uploads are not saved to the user’s ChatGPT file library. The resulting R2 object follows the existing private storage and cleanup rules.

## Compatibility and Failure Behavior

The widget feature-detects `uploadFile`, `selectFiles`, `getFileDownloadUrl`, and `callTool`. If required ChatGPT file APIs are unavailable, it explains that the owner can attach an image in the conversation and ask ChatGPT to call `store_article_image`; it does not weaken R2 CORS or transmit base64 image data through MCP.

Errors are mapped to concise states for unsupported type, empty file, excessive size, missing alt text, temporary upload failure, expired URL, secure-ingestion rejection, or unavailable host APIs. Retry keeps the selected local file and alt text where the browser allows it.

The widget does not trust client validation. `store_article_image` repeats all URL, SSRF, size, timeout, MIME, and binary-signature validation on the server.

## Security and Privacy

- The widget never receives R2 credentials or database access.
- The ChatGPT upload uses `library: false`.
- Temporary download URLs exist only in widget memory and the existing server ingestion call.
- The tool audit continues to hash the file ID and exclude the raw file ID and URL.
- No external origins are added to the widget CSP.
- OAuth scope checks remain independent on both the render and storage tools.
- Managed images remain publicly inaccessible until a published saved article references them.

## Testing

Automated tests cover:

- versioned resource URI and MCP Apps MIME type;
- widget/resource CSP and compatibility metadata;
- render-tool OAuth and annotations;
- `store_article_image` app visibility;
- supported MIME and 8 MB client limits embedded in the widget;
- required alt text and maximum length;
- `library: false` upload behavior;
- feature detection and attach-in-chat fallback copy;
- snake-case file payload sent to `store_article_image`;
- absence of secrets, external scripts, and direct R2 endpoints in widget HTML.

Final verification runs focused tests, formatting, ESLint, TypeScript, the full Vitest suite, and a production build.

## Acceptance Criteria

- ChatGPT can render a minimal article-image picker from `open_article_image_uploader`.
- A selected supported image is transferred temporarily through ChatGPT and stored through the existing secure ingestion tool.
- The widget returns and displays usable managed Markdown.
- Images are not added to the ChatGPT file library.
- Unsupported clients receive a safe conversational fallback.
- Existing non-UI clients and signed-upload workflows continue to work.
