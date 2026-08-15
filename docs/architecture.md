# Architecture

Ameenfolio is a Next.js 16 App Router application with two public pages and a single-owner admin.

## Request flow

- Public React Server Components query published rows through Drizzle and Neon’s pooled HTTP connection.
- `proxy.ts` refreshes/checks Neon Auth sessions for `/admin/:path*`; `/admin/login` remains public.
- Every admin layout, Server Action, upload signing call, and cleanup call independently invokes `requireAdmin`.
- `requireAdmin` checks the linked account list for GitHub provider account ID `231661599`; a Neon user ID alone is never accepted.
- Private R2 icons stream through `/media/[...key]`. Résumés stream only through `/resume` with an attachment disposition.
- `/api/wakatime/status` turns the owner’s server-only WakaTime data into a cached, privacy-safe payload containing coding/staleness state, today’s total, weekly total, daily average, top language, a seven-day breakdown, and timestamps. Project and branch names, raw heartbeat metadata, and the API key never reach the browser.
- A future `R2_PUBLIC_BASE_URL` changes icon delivery to a Cloudflare custom hostname while stored object keys remain unchanged.

## Data ownership

Portfolio Copilot is exposed only through `/api/admin/assistant/*`. Every route
rechecks `requireAdmin`. Model providers receive named, Zod-validated portfolio
tools rather than database, shell, storage, or arbitrary network access. Drafts
may be created automatically; public, destructive, and existing-content edits
are stored as approvals and execute through the normal admin actions only after
the owner approves them.

Neon Auth owns users and sessions in `neon_auth`. Application tables contain only portfolio content. `site_settings` is a database-enforced singleton. A PostgreSQL trigger prevents a ninth published homepage project, while Server Actions provide the same validation before writing.

## Cache invalidation

Public reads are server cached with the `portfolio` and `projects` tags. Successful mutations invalidate both public routes immediately. Database and R2 clients initialize lazily so imports and CI builds do not require runtime secrets.

## Source organization

```text
src/
├── app/                  Next.js routes, layouts, route handlers, and Server Actions
├── components/
│   ├── admin/            Admin-specific forms, navigation, and content managers
│   ├── layout/           Shared application-shell and status-page composition
│   ├── portfolio/        Public portfolio compositions
│   └── ui/               Registry-managed shadcn/ui primitives only
├── db/                   Drizzle schema, queries, seed, and database tests
└── lib/
    ├── auth/             Neon Auth session and owner-authorization boundary
    └── storage/          R2 client, upload rules, cleanup client, and tests
```

Route files coordinate requests and data. Reusable visual primitives live only in `components/ui` and stay aligned with the official shadcn registry. Application-specific components compose those primitives inside `admin`, `layout`, or `portfolio`; they do not reimplement buttons, fields, dialogs, alerts, cards, badges, tables, or empty states.

Shared infrastructure is grouped by responsibility under `lib`. Server-only modules identify themselves explicitly and are imported directly rather than through barrel files, which keeps client/server boundaries visible and avoids accidental bundle expansion.

The `lib/ai` boundary owns assistant providers, tools, approvals, and audit
persistence. Provider implementations must reuse that tool layer so a future
Claude or MCP client cannot acquire a different permission model.

`/api/mcp` is the private Streamable HTTP MCP resource. OAuth 2.1 discovery,
dynamic public-client registration, authorization code + PKCE, hashed bearer
tokens, rotation, expiry, and owner consent protect it. MCP calls use a
dedicated Bippy audit thread and can only read or create pending approval
records. Existing admin actions remain the sole mutation boundary.

### MCP article images

File-capable MCP clients can call `store_article_image` with an attached or
generated file and meaningful alt text. The tool uses the `portfolio:draft`
scope and OpenAI's `openai/fileParams` extension while retaining the standard
MCP JSON input and OAuth declaration. Clients without file-parameter support
can continue using `request_media_upload` and its signed PUT URL.

ChatGPT can also open `open_article_image_uploader`, a versioned MCP Apps
resource that provides a compact fallback picker. Local files are uploaded to
ChatGPT temporarily with `library: false`; the widget then calls the same
`store_article_image` tool and displays its managed Markdown. The widget has no
R2 credentials, direct storage access, external scripts, or network origins of
its own. Hosts without ChatGPT's file APIs fall back to attaching the image in
the conversation. After deploying a widget-contract change, reconnect or
refresh the MCP connector so the host reloads the latest tool descriptor and
resource.

The server never trusts or persists the provider's temporary download URL. It
resolves every HTTPS hop, rejects non-public network destinations, pins the
connection to a validated address, follows no more than three validated
redirects, stops after ten seconds or 8 MB, and verifies PNG, JPEG, WebP, or GIF
binary signatures against declared MIME types. It then writes the bytes to the
private R2 bucket and records only the managed object key, detected MIME, byte
size, MCP client ID, and creation time in `agent_media_uploads`. Audit records
contain a SHA-256 hash of the provider file ID rather than the ID or URL.

The tool returns `![alt text](/media/posts/...)`. The MCP client inserts this
Markdown into the existing writing draft or update proposal. Uploading alone
does not make the object public: `/media/[...key]` requires a published post to
reference the key. Approval previews keep using short-lived signed downloads.

The authenticated MCP maintenance job removes an upload only when it is older
than seven days and no saved post, including a private draft, references its
managed path. Pending proposals do not extend retention. Uploads receive a
durable pending row before R2 receives bytes, and become ready only after the
write succeeds. Post saves and cleanup share a per-object database lock;
cleanup claims an unreferenced object before deleting it, preventing a post
from gaining the reference during deletion. A storage failure leaves the claim
available for the next daily retry, while successful deletion retains a small
tombstone that prevents a stale key from being reused.

## Maintenance checks

Prettier formats application-owned source while `src/components/ui` remains in its upstream registry format. CI runs `format:check`, lint, type-checking, unit/integration tests, the production build, and browser tests. Empty legacy directories and static portfolio media are intentionally absent; managed content assets belong in R2.
