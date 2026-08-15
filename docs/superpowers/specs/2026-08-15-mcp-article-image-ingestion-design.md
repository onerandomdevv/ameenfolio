# MCP Article Image Ingestion Design

## Goal

Allow an authenticated external MCP client such as ChatGPT to pass a generated or user-provided image directly into Ameenfolio, store it safely in private R2, and receive Markdown that can be inserted into an article proposal.

The upload itself is allowed immediately because it is private and non-public. Creating, updating, or publishing an article continues to use the existing proposal and owner-approval workflow.

## Scope

This feature covers article images only. It does not change project icons, profile images, résumé uploads, image generation providers, article approval rules, or the public media authorization model.

The existing `request_media_upload` tool remains available as a generic signed-upload fallback for MCP clients that can perform an HTTP PUT. The new flow adds a file-aware tool optimized for clients that can pass file references to MCP tools.

## MCP Contract

Register a new `store_article_image` tool with `portfolio:draft` scope.

The input contains:

- `file`: an OpenAI-compatible file object with required `download_url` and `file_id` fields plus optional `mime_type` and `file_name` fields.
- `altText`: meaningful Markdown alt text between 1 and 180 characters.

The tool descriptor declares `_meta["openai/fileParams"] = ["file"]`. Its security metadata continues to advertise the existing OAuth scheme. The tool is marked as mutating but non-destructive and open-world because the server must retrieve the temporary file from an external origin.

On success, the tool returns:

- the managed R2 object key;
- the canonical `/media/<key>` path;
- detected content type and byte size;
- ready-to-insert Markdown: `![alt text](/media/<key>)`.

Temporary source URLs and ChatGPT file IDs are never returned, stored in the database, or written to audit arguments.

## Secure Download and Validation

The server treats every file object as untrusted even when ChatGPT produced it.

The downloader will:

1. Accept HTTPS URLs only and reject embedded credentials.
2. Resolve the destination hostname and reject loopback, private, link-local, multicast, unspecified, and reserved IPv4 or IPv6 addresses.
3. Disable automatic redirect following, allow at most three redirects, and repeat URL and address validation for every hop.
4. Apply a ten-second request timeout.
5. Reject a declared `Content-Length` above 8 MB.
6. Read the response through a bounded stream and stop once it exceeds 8 MB, including when no length header is present.
7. Accept only PNG, JPEG, WebP, and GIF.
8. Detect the format from binary signatures and require it to agree with any supplied response MIME type or MCP `mime_type` value.
9. Reject empty, malformed, SVG, HTML, executable, archive, and mismatched files.

The downloader is isolated from MCP registration so URL policy, redirect handling, byte limits, and signature detection can be unit-tested without R2 or database dependencies.

## Storage and Tracking

After validation, the server writes the bytes directly to the private R2 bucket under the existing unpredictable `posts/<year>/<48-hex>.<extension>` key format. A new server-only storage primitive performs the R2 `PutObject`; browser upload signing remains unchanged.

Each successful MCP image upload creates an `agent_media_uploads` row containing:

- UUID;
- unique object key;
- content type;
- byte size;
- MCP client ID;
- creation timestamp.

The table does not store the temporary download URL, file ID, IP address, authorization data, or article content. The client relationship uses `ON DELETE SET NULL` so disconnecting a client does not silently delete an image that an article may use.

The R2 write occurs before the tracking insert. If the database insert fails, the server attempts to delete the newly written object and logs any cleanup failure.

## Article Integration and Visibility

The tool returns a normal managed media path. ChatGPT inserts that path into `bodyMarkdown` and then calls the existing article draft or update proposal tool.

Existing behavior remains responsible for:

- rendering signed image URLs in approval previews;
- returning image content in the MCP conversation preview;
- saving approved Markdown and rendered HTML;
- exposing `/media/posts/...` only when a saved database record references the image.

Uploading an image alone never makes it publicly retrievable.

## Orphan Cleanup

The existing authenticated MCP maintenance endpoint will also clean tracked article images.

For `agent_media_uploads` rows older than seven days, cleanup checks current saved post Markdown. If no saved post references `/media/<key>`, it deletes the R2 object and then removes the tracking row. If a saved draft or published post references the key, the row and object remain.

Pending proposals do not extend the seven-day lifetime. This makes the agreed retention window deterministic: the article must be approved into a saved draft within seven days to retain the image.

Deletion order is object first, database row second. A failed R2 deletion retains the row so a later cleanup run can retry. Cleanup logs aggregate counts and individual failures without logging secrets.

## Audit and Failure Behavior

The MCP tool runs through the existing audited tool-call wrapper. Audit arguments include only the file name, declared MIME type, declared file ID hash, and alt text; the raw file ID and temporary URL are excluded.

Expected failures return concise messages for unsupported type, excessive size, unsafe source, timeout, malformed content, R2 failure, or tracking failure. Detailed causes are recorded in structured server logs. A failed upload never creates an article proposal automatically.

## Client Compatibility

ChatGPT can populate the file input through its documented file-parameter extension. The feature remains compatible with standard MCP because the input is ordinary JSON and the existing signed-upload tool remains available for clients without the OpenAI extension.

No provider hostname is hardcoded into the downloader. Safety is enforced through protocol, DNS, redirect, size, and content validation instead.

## Testing

Unit tests will cover:

- file input schema and descriptor metadata;
- safe and unsafe URL forms;
- private and reserved IPv4 and IPv6 detection;
- redirect limits and validation on every hop;
- request timeout and oversized declared or streamed bodies;
- PNG, JPEG, WebP, and GIF signature detection;
- MIME mismatches and rejected formats;
- Markdown escaping for alt text;
- unpredictable managed key generation;
- seven-day cleanup selection and saved-post reference detection;
- cleanup retry behavior when R2 deletion fails;
- redaction of temporary URLs and raw file IDs from audit data.

Integration-focused tests will mock network, R2, and database boundaries only where unavoidable and verify that a valid file is stored, tracked, and returned as managed Markdown while failed tracking triggers object cleanup.

Final verification will run formatting, ESLint, TypeScript, focused tests, the full unit test suite, and a production build.

## Acceptance Criteria

- ChatGPT sees a file-capable `store_article_image` tool after refreshing the connector.
- A generated or selected supported image can be stored without the owner manually hosting it.
- The tool returns usable managed Markdown for an article proposal.
- Unapproved uploads remain inaccessible through the public media route.
- Article approval and publishing behavior remain unchanged.
- Unsafe, oversized, mismatched, or non-image downloads are rejected.
- Unreferenced tracked uploads are removed after seven days by the maintenance job.
- No temporary download URL, raw file ID, R2 credential, or session secret is persisted or logged.
