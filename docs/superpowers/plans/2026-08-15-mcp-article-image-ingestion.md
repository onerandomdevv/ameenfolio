# MCP Article Image Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let authenticated MCP clients hand Ameenfolio an article image file, store it privately and safely in R2, and receive managed Markdown without exposing temporary provider credentials.

**Architecture:** A pure validation/downloader module enforces URL, network, size, and image-signature policy; a server-only ingestion service writes validated bytes to R2 and records ownership in PostgreSQL. The MCP tool exposes OpenAI's standard file parameter metadata, while the existing proposal flow and `/media` reference gate continue to control article approval and public visibility. The authenticated maintenance route removes tracked, unreferenced uploads after seven days.

**Tech Stack:** Next.js 16 Route Handlers, TypeScript, MCP SDK, Zod 4, Node HTTPS/DNS APIs, Drizzle ORM, Neon PostgreSQL, AWS S3 SDK for Cloudflare R2, Vitest.

**Status:** Implemented on `codex/mcp-article-image-ingestion`; final verification is recorded in the task handoff.

## Global Constraints

- `store_article_image` requires `portfolio:draft`; uploading is immediate, private, mutating, non-destructive, and open-world.
- The file input uses required `download_url` and `file_id`, optional `mime_type` and `file_name`, plus `altText` of 1–180 characters.
- The descriptor must merge OAuth security metadata with `_meta["openai/fileParams"] = ["file"]`.
- Only PNG, JPEG, WebP, and GIF are accepted, with an 8 MB ceiling and a ten-second timeout.
- Every HTTPS destination and each of at most three redirects must resolve only to public IP addresses; the actual connection must use a validated address.
- Raw download URLs and raw file IDs must never be persisted, returned, or logged.
- Objects use existing `posts/<year>/<48-hex>.<extension>` keys and remain private until saved article Markdown references them; public delivery additionally requires a published post.
- Unreferenced tracked uploads older than seven days are deleted object-first and row-second; failed object deletion keeps the row for retry.
- Keep `request_media_upload` as a fallback for clients that can perform signed PUT uploads.

---

### Task 1: File input, descriptor metadata, and safe audit arguments

**Files:**

- Create: `src/lib/mcp/article-image-contract.ts`
- Test: `src/lib/mcp/article-image-contract.test.ts`

**Interfaces:**

- Produces: `articleImageInputSchema`, `articleImageToolMeta(scope)`, `redactArticleImageAuditArgs(input)`, and `articleImageMarkdown(altText, mediaPath)`.
- Consumes: the existing OAuth metadata shape used in `src/lib/mcp/tools.ts`.

- [x] **Step 1: Write failing contract tests**

```ts
it("declares the OpenAI file parameter beside OAuth security", () => {
  expect(articleImageToolMeta("portfolio:draft")).toEqual({
    _meta: {
      securitySchemes: [{ type: "oauth2", scopes: ["portfolio:draft"] }],
      "openai/fileParams": ["file"],
    },
  });
});

it("redacts the temporary URL and hashes the file id", () => {
  const audit = redactArticleImageAuditArgs(validInput);
  expect(JSON.stringify(audit)).not.toContain(validInput.file.download_url);
  expect(JSON.stringify(audit)).not.toContain(validInput.file.file_id);
  expect(audit.fileIdSha256).toMatch(/^[a-f0-9]{64}$/);
});

it("escapes Markdown alt text", () => {
  expect(
    articleImageMarkdown("A [draft] \\ view", "/media/posts/2026/a.png"),
  ).toBe("![A \\[draft\\] \\\\ view](/media/posts/2026/a.png)");
});
```

- [x] **Step 2: Run the focused test and verify it fails because the module does not exist**

Run: `npx vitest run src/lib/mcp/article-image-contract.test.ts`

- [x] **Step 3: Implement the contract helpers**

```ts
export const articleImageInputSchema = z.object({
  file: z.object({
    download_url: z.url(),
    file_id: z.string().min(1),
    mime_type: z.string().optional(),
    file_name: z.string().max(180).optional(),
  }),
  altText: z.string().trim().min(1).max(180),
});
```

Hash `file_id` with SHA-256, omit `download_url`, and escape backslashes and square brackets before creating Markdown.

- [x] **Step 4: Run the focused test and verify it passes**

Run: `npx vitest run src/lib/mcp/article-image-contract.test.ts`

### Task 2: Image signatures and safe destination policy

**Files:**

- Create: `src/lib/storage/remote-image.ts`
- Test: `src/lib/storage/remote-image.test.ts`

**Interfaces:**

- Produces: `detectArticleImage(bytes)`, `validateRemoteImageUrl(value)`, `assertPublicAddresses(addresses)`, and `RemoteImageError`.
- `detectArticleImage` returns `{ contentType, extension }` for valid PNG/JPEG/WebP/GIF bytes.

- [x] **Step 1: Write failing unit tests for allowed signatures and unsafe networks**

Cover real minimal fixtures for PNG, JPEG, WebP, and GIF; MIME mismatch; HTML/SVG/ZIP/empty data; HTTP URLs; URL credentials; and private, loopback, link-local, multicast, documentation, benchmark, unspecified, and IPv4-mapped IPv6 ranges.

```ts
expect(() => validateRemoteImageUrl("http://cdn.example/image.png")).toThrow(
  "HTTPS",
);
expect(() =>
  assertPublicAddresses([{ address: "127.0.0.1", family: 4 }]),
).toThrow("public");
expect(detectArticleImage(pngFixture)).toEqual({
  contentType: "image/png",
  extension: ".png",
});
```

- [x] **Step 2: Run the focused test and verify expected failures**

Run: `npx vitest run src/lib/storage/remote-image.test.ts`

- [x] **Step 3: Implement URL, IP, and binary validation**

Use `node:net` `BlockList` entries for forbidden IPv4/IPv6 ranges. Validate PNG signature plus IEND trailer, JPEG SOI/EOI, GIF header/trailer, and WebP RIFF length plus `WEBP` marker. Normalize MIME values by lowercasing and removing parameters before comparison.

- [x] **Step 4: Run the focused test and verify it passes**

Run: `npx vitest run src/lib/storage/remote-image.test.ts`

### Task 3: Bounded, redirect-safe HTTPS downloader

**Files:**

- Modify: `src/lib/storage/remote-image.ts`
- Modify: `src/lib/storage/remote-image.test.ts`

**Interfaces:**

- Produces: `downloadRemoteArticleImage(input, dependencies?)` returning `{ bytes, contentType }`.
- The injected test boundary provides DNS results and synthetic HTTPS responses; production uses `dns.lookup` and `https.request` with a pinned validated address.

- [x] **Step 1: Add failing downloader tests**

Test successful download, declared `Content-Length` over 8 MB, chunked data crossing 8 MB, timeout, non-2xx status, more than three redirects, redirect to a private address, response/input MIME mismatch, and `content-encoding` other than identity.

```ts
await expect(
  downloadRemoteArticleImage(input, oversizedResponseDeps),
).rejects.toMatchObject({ code: "too_large" });
expect(privateRedirectDeps.requestedUrls).toEqual([
  "https://public.example/image.png",
]);
```

- [x] **Step 2: Run the downloader tests and verify they fail**

Run: `npx vitest run src/lib/storage/remote-image.test.ts`

- [x] **Step 3: Implement pinned HTTPS retrieval**

Resolve every hostname with `dns.lookup({ all: true, verbatim: true })`, reject the hop unless every returned address is public, then use `https.request` with a custom `lookup` callback that supplies one validated address. Send `Accept-Encoding: identity`, use an abort signal with a ten-second timer, process redirects manually, cap redirects at three, check `Content-Length`, and accumulate chunks only through 8 MB. Validate the final bytes and both declared MIME values.

- [x] **Step 4: Run the downloader tests and verify they pass**

Run: `npx vitest run src/lib/storage/remote-image.test.ts`

### Task 4: Direct R2 storage and tracked database row

**Files:**

- Modify: `src/lib/storage/server.ts`
- Modify: `src/db/schema.ts`
- Create: `src/lib/mcp/article-image-service.ts`
- Create: `src/lib/mcp/article-image-service.test.ts`
- Generate: `drizzle/0036_*.sql`
- Modify: `drizzle/meta/_journal.json`
- Generate: `drizzle/meta/0036_snapshot.json`

**Interfaces:**

- Produces: `putObject(resourceType, contentType, bytes)`, `deleteObjectOrThrow(key)`, `storeArticleImage(input, actor)`.
- `storeArticleImage` returns `{ key, mediaPath, contentType, size, markdown }`.

- [x] **Step 1: Add a failing service test**

Mock only downloader, storage, and database boundaries. Verify a valid image is stored and tracked, the MCP client ID is recorded, and a failed insert invokes strict object deletion before returning a tracking failure.

```ts
expect(result.markdown).toBe(`![Architecture](/media/${key})`);
expect(insertUpload).toHaveBeenCalledWith({
  objectKey: key,
  contentType: "image/png",
  byteSize: bytes.byteLength,
  clientId: "client-1",
});
```

- [x] **Step 2: Run the focused service test and verify it fails**

Run: `npx vitest run src/lib/mcp/article-image-service.test.ts`

- [x] **Step 3: Add the schema and storage primitives**

Add `agent_media_uploads` after `mcp_oauth_clients` with UUID primary key, unique object key, content type, integer byte size, nullable client ID referencing `mcp_oauth_clients.client_id` with `ON DELETE SET NULL`, creation timestamp, and creation-time index. Add strict R2 PUT and DELETE functions while keeping existing best-effort `deleteObject` behavior unchanged.

- [x] **Step 4: Implement the ingestion service**

Download and validate first, create an unpredictable post key through the storage primitive, insert the tracking row, and on insert failure call `deleteObjectOrThrow`. Log the original tracking failure and any compensating-delete failure without the source URL or raw file ID.

- [x] **Step 5: Generate the Drizzle migration**

Run: `npm run db:generate`

- [x] **Step 6: Run focused service, storage-rule, and schema tests**

Run: `npx vitest run src/lib/mcp/article-image-service.test.ts src/lib/storage/rules.test.ts src/db/schema.integration.test.ts`

### Task 5: Register the file-aware MCP tool

**Files:**

- Modify: `src/lib/mcp/tools.ts`
- Modify: `src/lib/mcp/article-image-contract.test.ts`

**Interfaces:**

- Consumes: contract helpers and `storeArticleImage`.
- Produces: registered `store_article_image` tool available to `portfolio:draft` clients.

- [x] **Step 1: Extend the failing contract test for the complete descriptor**

Verify that the descriptor uses `articleImageInputSchema.shape`, includes file metadata and OAuth security together, and marks `readOnlyHint: false`, `destructiveHint: false`, `openWorldHint: true`.

- [x] **Step 2: Run the focused test and verify it fails**

Run: `npx vitest run src/lib/mcp/article-image-contract.test.ts`

- [x] **Step 3: Register `store_article_image`**

Parse input, require `portfolio:draft`, build safe audit arguments before calling `audited`, invoke the ingestion service, and return structured content plus concise instructions to insert the returned Markdown into `prepare_post_draft` or `prepare_post_update`. Never pass the original file object to `audited`.

- [x] **Step 4: Run MCP contract tests and typecheck the registration**

Run: `npx vitest run src/lib/mcp/article-image-contract.test.ts`

Run: `npm run typecheck`

### Task 6: Seven-day orphan cleanup

**Files:**

- Create: `src/lib/mcp/article-image-cleanup.ts`
- Test: `src/lib/mcp/article-image-cleanup.test.ts`
- Modify: `src/app/api/internal/mcp/cleanup/route.ts`

**Interfaces:**

- Produces: `cleanupExpiredArticleImages(now)` returning `{ scanned, deleted, retained, failed }`.
- Consumes: `agentMediaUploads`, saved `posts.bodyMarkdown`, and `deleteObjectOrThrow`.

- [x] **Step 1: Write failing cleanup-policy and orchestration tests**

Verify the exact seven-day cutoff, saved draft and published references both retain images, pending proposals do not count, successful object deletion removes the row, and failed object deletion keeps the row for retry.

```ts
expect(selectExpired(now)).toUseCutoff(new Date(now.getTime() - 7 * DAY));
expect(await cleanupWith({ referenced: true })).toEqual({
  scanned: 1,
  deleted: 0,
  retained: 1,
  failed: 0,
});
```

- [x] **Step 2: Run the focused cleanup test and verify it fails**

Run: `npx vitest run src/lib/mcp/article-image-cleanup.test.ts`

- [x] **Step 3: Implement cleanup and extend the maintenance response**

Query only tracked rows older than seven days, load saved post Markdown, test for `/media/${objectKey}`, delete unreferenced R2 objects strictly, then delete their rows. Log per-object failures and aggregate counts. Run credential cleanup and media cleanup together in the authenticated POST handler and return both result objects.

- [x] **Step 4: Run cleanup tests and route-level type checking**

Run: `npx vitest run src/lib/mcp/article-image-cleanup.test.ts`

Run: `npm run typecheck`

### Task 7: Documentation and complete verification

**Files:**

- Modify: `docs/architecture.md`
- Modify: `.env.example` only if the existing maintenance-secret documentation is incomplete.
- Modify: `docs/superpowers/plans/2026-08-15-mcp-article-image-ingestion.md` to check completed steps.

**Interfaces:**

- Documents the client sequence: attach/generate image, call `store_article_image`, insert returned Markdown, prepare the article proposal, approve it within seven days.

- [x] **Step 1: Document the MCP image workflow and retention rule**

Include the exact tool name, supported formats, 8 MB limit, private-before-approval behavior, seven-day retention, the unchanged signed-upload fallback, and the need to refresh the ChatGPT connector after deployment.

- [x] **Step 2: Run formatting and focused tests**

Run: `npx prettier --write src/lib/mcp/article-image-contract.ts src/lib/mcp/article-image-contract.test.ts src/lib/storage/remote-image.ts src/lib/storage/remote-image.test.ts src/lib/mcp/article-image-service.ts src/lib/mcp/article-image-service.test.ts src/lib/mcp/article-image-cleanup.ts src/lib/mcp/article-image-cleanup.test.ts src/lib/mcp/tools.ts src/lib/storage/server.ts src/db/schema.ts src/app/api/internal/mcp/cleanup/route.ts docs/architecture.md docs/superpowers/plans/2026-08-15-mcp-article-image-ingestion.md`

Run: `npx vitest run src/lib/mcp/article-image-contract.test.ts src/lib/storage/remote-image.test.ts src/lib/mcp/article-image-service.test.ts src/lib/mcp/article-image-cleanup.test.ts src/lib/storage/rules.test.ts src/db/schema.integration.test.ts`

- [x] **Step 3: Run the full verification suite**

Run: `npm run format:check`

Run: `npm run lint`

Run: `npm run typecheck`

Run: `npm test`

Run: `npm run build`

- [x] **Step 4: Review the final diff for secret leakage and migration completeness**

Run: `git diff --check`

Run: `git status --short`

Run: `rg -n "download_url|file_id" src/lib/mcp src/lib/storage` and verify they appear only in input parsing, secure retrieval, hashing, and tests—not structured logs, database writes, or tool results.
