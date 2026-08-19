export const ARTICLE_IMAGE_WIDGET_URI =
  "ui://ameenfolio/article-image-uploader-v1.html";
export const ARTICLE_IMAGE_WIDGET_MIME_TYPE = "text/html;profile=mcp-app";
export const ARTICLE_IMAGE_WIDGET_MAX_BYTES = 8 * 1024 * 1024;
export const ARTICLE_IMAGE_WIDGET_ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

const oauthSecurity = [
  { type: "oauth2" as const, scopes: ["portfolio:draft"] },
];

export function articleImageWidgetToolDefinition() {
  return {
    title: "Open article image uploader",
    description:
      "Open a compact image picker for storing an article image and receiving managed Markdown.",
    inputSchema: {},
    _meta: {
      securitySchemes: oauthSecurity,
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
  };
}

export function articleImageWidgetHtml() {
  const widgetConfig = JSON.stringify({
    maxBytes: ARTICLE_IMAGE_WIDGET_MAX_BYTES,
    allowedTypes: ARTICLE_IMAGE_WIDGET_ALLOWED_TYPES,
  });
  return String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Article image uploader</title>
    <style>
      :root { color-scheme: light dark; font-family: ui-sans-serif, system-ui, sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; padding: 16px; background: transparent; color: CanvasText; }
      main { display: grid; gap: 14px; max-width: 680px; }
      h1 { margin: 0; font-size: 16px; line-height: 1.35; }
      p { margin: 0; color: color-mix(in srgb, CanvasText 68%, transparent); font-size: 13px; line-height: 1.5; }
      .picker { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; }
      .actions { display: flex; flex-wrap: wrap; gap: 8px; }
      button, .file-button { min-height: 40px; border: 1px solid color-mix(in srgb, CanvasText 18%, transparent); border-radius: 8px; padding: 9px 12px; background: color-mix(in srgb, CanvasText 7%, transparent); color: CanvasText; cursor: pointer; font: inherit; font-size: 13px; }
      button:hover, .file-button:hover { border-color: color-mix(in srgb, CanvasText 38%, transparent); }
      button:focus-visible, .file-button:focus-within, textarea:focus-visible { outline: 2px solid #8edb00; outline-offset: 2px; }
      button:disabled { cursor: not-allowed; opacity: .48; }
      input[type=file] { position: absolute; inline-size: 1px; block-size: 1px; opacity: 0; pointer-events: none; }
      .selection { display: none; align-items: center; gap: 12px; padding: 10px; border: 1px solid color-mix(in srgb, CanvasText 14%, transparent); border-radius: 8px; }
      .selection.visible { display: flex; }
      .preview { inline-size: 62px; block-size: 62px; flex: 0 0 auto; border-radius: 6px; object-fit: cover; background: color-mix(in srgb, CanvasText 8%, transparent); }
      .selection-copy { min-width: 0; }
      .filename { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: CanvasText; }
      label { display: grid; gap: 6px; font-size: 13px; }
      textarea { inline-size: 100%; min-block-size: 72px; resize: vertical; border: 1px solid color-mix(in srgb, CanvasText 18%, transparent); border-radius: 8px; padding: 10px; background: color-mix(in srgb, CanvasText 4%, transparent); color: CanvasText; font: inherit; }
      .primary { background: CanvasText; color: Canvas; border-color: CanvasText; font-weight: 650; }
      .status { min-height: 20px; }
      .status.error { color: #d94a4a; }
      .success { display: none; gap: 8px; }
      .success.visible { display: grid; }
      code { display: block; overflow-wrap: anywhere; border: 1px solid color-mix(in srgb, CanvasText 14%, transparent); border-radius: 8px; padding: 10px; background: color-mix(in srgb, CanvasText 5%, transparent); font-size: 12px; }
      .fallback { display: none; }
      .fallback.visible { display: block; }
    </style>
  </head>
  <body>
    <main>
      <div>
        <h1>Add an article image</h1>
        <p>Choose an image, provide useful alt text, then store it privately for an article.</p>
      </div>

      <div class="picker">
        <div class="actions">
          <label class="file-button" id="local-label">
            Choose image
            <input id="local-file" type="file" accept="${ARTICLE_IMAGE_WIDGET_ALLOWED_TYPES.join(",")}" />
          </label>
          <button id="chatgpt-file" type="button" hidden>Choose from ChatGPT</button>
        </div>

        <div class="selection" id="selection">
          <img class="preview" id="preview" alt="Selected image preview" hidden />
          <div class="selection-copy">
            <p class="filename" id="filename"></p>
            <p id="file-meta"></p>
          </div>
        </div>
      </div>

      <label>
        Alt text
        <textarea id="alt-text" maxlength="180" required placeholder="Describe the image for readers who cannot see it"></textarea>
      </label>

      <button class="primary" id="store" type="button" disabled>Store image</button>
      <p class="status" id="status" role="status" aria-live="polite"></p>

      <div class="success" id="success">
        <p>Managed Markdown</p>
        <code id="markdown"></code>
        <button id="copy" type="button">Copy Markdown</button>
      </div>

      <p class="fallback" id="fallback">
        This host cannot open the file picker. Please attach the image in the conversation and ask the assistant to store it as an article image.
      </p>
    </main>

    <script>
      (() => {
        const WIDGET_CONFIG = ${widgetConfig};
        const ALLOWED_TYPES = new Set(WIDGET_CONFIG.allowedTypes);
        const openai = window.openai;
        const localInput = document.getElementById("local-file");
        const localLabel = document.getElementById("local-label");
        const chatgptButton = document.getElementById("chatgpt-file");
        const selection = document.getElementById("selection");
        const preview = document.getElementById("preview");
        const filename = document.getElementById("filename");
        const fileMeta = document.getElementById("file-meta");
        const altText = document.getElementById("alt-text");
        const storeButton = document.getElementById("store");
        const status = document.getElementById("status");
        const success = document.getElementById("success");
        const markdown = document.getElementById("markdown");
        const copyButton = document.getElementById("copy");
        const fallback = document.getElementById("fallback");
        let selected = null;
        let previewUrl = null;

        function setStatus(message, isError = false) {
          status.textContent = message;
          status.classList.toggle("error", isError);
        }

        function clearPreviewUrl() {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          previewUrl = null;
        }

        function renderSelection(next, localFile) {
          selected = next;
          clearPreviewUrl();
          filename.textContent = next.fileName || "Selected image";
          fileMeta.textContent = next.mimeType || "Image";
          if (localFile) {
            previewUrl = URL.createObjectURL(localFile);
            preview.src = previewUrl;
            preview.hidden = false;
          } else {
            preview.removeAttribute("src");
            preview.hidden = true;
          }
          selection.classList.add("visible");
          success.classList.remove("visible");
          storeButton.disabled = false;
          setStatus("");
        }

        function validateFile(file) {
          if (!file || file.size < 1) throw new Error("Choose a non-empty image.");
          if (file.size > WIDGET_CONFIG.maxBytes) throw new Error("The image must be 8 MB or smaller.");
          if (!ALLOWED_TYPES.has(file.type)) throw new Error("Use a PNG, JPEG, WebP, or GIF image.");
        }

        function toolOutput(result) {
          return result?.structuredContent
            ?? result?.mcp_tool_result?.structuredContent
            ?? result?.call_tool_result?.structuredContent
            ?? result;
        }

        localInput.addEventListener("change", () => {
          try {
            const file = localInput.files?.[0];
            validateFile(file);
            renderSelection({ localFile: file, fileName: file.name, mimeType: file.type }, file);
          } catch (error) {
            selected = null;
            storeButton.disabled = true;
            setStatus(error instanceof Error ? error.message : "Unable to select this image.", true);
          }
        });

        chatgptButton.addEventListener("click", async () => {
          try {
            setStatus("Opening ChatGPT files…");
            const files = await openai.selectFiles({ accept: ["image/png", "image/jpeg", "image/webp", "image/gif"], multiple: false });
            const file = files?.[0];
            if (!file) return setStatus("");
            if (file.mimeType && !ALLOWED_TYPES.has(file.mimeType)) throw new Error("Use a PNG, JPEG, WebP, or GIF image.");
            renderSelection({ fileId: file.fileId, fileName: file.fileName, mimeType: file.mimeType });
          } catch (error) {
            setStatus(error instanceof Error ? error.message : "Unable to choose this image.", true);
          }
        });

        storeButton.addEventListener("click", async () => {
          const description = altText.value.trim();
          if (!selected) return setStatus("Choose an image first.", true);
          if (!description || description.length > 180) return setStatus("Add alt text between 1 and 180 characters.", true);

          storeButton.disabled = true;
          setStatus("Preparing image…");
          try {
            if (!selected.fileId) {
              const upload = await openai.uploadFile(selected.localFile, { library: false });
              selected.fileId = upload.fileId;
            }
            const download = await openai.getFileDownloadUrl({ fileId: selected.fileId });
            const downloadUrl = download.downloadUrl;
            setStatus("Storing image securely…");
            const response = await openai.callTool("store_article_image", {
              file: {
                download_url: downloadUrl,
                file_id: selected.fileId,
                mime_type: selected.mimeType,
                file_name: selected.fileName,
              },
              altText: description,
            });
            const output = toolOutput(response);
            if (!output?.markdown) throw new Error("The storage tool did not return Markdown.");
            markdown.textContent = output.markdown;
            success.classList.add("visible");
            setStatus("Image stored privately and ready to insert.");
          } catch (error) {
            setStatus(error instanceof Error ? error.message : "Unable to store this image.", true);
          } finally {
            storeButton.disabled = false;
          }
        });

        copyButton.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(markdown.textContent || "");
            setStatus("Markdown copied.");
          } catch {
            setStatus("Copy the Markdown manually from the field above.", true);
          }
        });

        const canCall = Boolean(openai?.callTool && openai?.getFileDownloadUrl);
        const canUpload = Boolean(canCall && openai?.uploadFile);
        const canSelect = Boolean(canCall && openai?.selectFiles);
        localInput.disabled = !canUpload;
        localLabel.setAttribute("aria-disabled", String(!canUpload));
        chatgptButton.hidden = !canSelect;
        fallback.classList.toggle("visible", !canUpload && !canSelect);
        window.addEventListener("beforeunload", clearPreviewUrl, { once: true });
      })();
    </script>
  </body>
</html>`;
}

export function articleImageWidgetResource() {
  return {
    uri: ARTICLE_IMAGE_WIDGET_URI,
    mimeType: ARTICLE_IMAGE_WIDGET_MIME_TYPE,
    text: articleImageWidgetHtml(),
    _meta: {
      ui: {
        prefersBorder: true,
        csp: { connectDomains: [], resourceDomains: [] },
      },
      "openai/widgetDescription":
        "A compact image picker that securely stores an article image and returns managed Markdown.",
      "openai/widgetPrefersBorder": true,
      "openai/widgetCSP": {
        connect_domains: [],
        resource_domains: [],
      },
    },
  };
}
