# Portfolio Copilot

Portfolio Copilot is an owner-only assistant inside the existing admin. OpenAI
is the first provider; the surrounding thread, tool, approval, and audit layers
are provider-neutral so another model provider can be added without giving it a
different set of application permissions.

## Setup

1. Create a project-scoped API key in the OpenAI Platform.
2. Put it in `.env.local` as `OPENAI_API_KEY` for local development. Never paste
   it into chat, prefix it with `NEXT_PUBLIC_`, or commit it.
3. Set `OPENAI_API_KEY` as a server-side deployment secret in preview and
   production.
4. Set `OPENAI_DEFAULT_MODEL` for new conversations and list the models the
   composer may offer in the comma-separated `OPENAI_ALLOWED_MODELS`. The
   default is always added to the allowlist. Only add compatible models the
   selected OpenAI project can access.
5. Apply the pending Drizzle migrations with `npm run db:migrate` before
   deploying the application code. `0026` creates the assistant audit tables,
   `0027` adds curated cross-conversation memory, `0032` adds persistent
   conversation pinning, and `0033` permanently separates ordinary chats from
   MCP audit threads.

If the key is absent, the Copilot page remains usable as a setup screen and no
model request is attempted. The SDK resolves the key only when a message is
sent, so imports, CI, and production builds do not require it.

The model is selected in the composer before the first message. It is then
stored on the conversation and remains fixed for every later turn, even if the
deployment default changes.

When `WAKATIME_API_KEY` is configured, Bippy also receives two native,
read-only tools: current coding activity and the current-week summary. They use
the same one-minute server cache and privacy-safe projection as the public
activity UI. Bippy can see whether Aliameen is active, today's duration, the
last activity time, weekly totals, active-day average, seven daily totals, and
the top programming language. Project, branch, file, machine, and API-key data
are never included.

The conversation sidebar deliberately shows names without dates. Its row menu
can rename a chat, pin it above the normal recency order, or permanently delete
the conversation and its cascading message/action history. MCP audit threads
carry a dedicated `mcp_audit` classification, are excluded from this list even
after their OAuth client expires, and remain accessible only through protected
client Activity pages while that client record exists.

## Bippy outbound MCP connections

**Bippy → Connections** lets the administrator connect Bippy to remote
Streamable HTTP MCP servers. This is the opposite direction from the private
Ameenfolio MCP resource below: Bippy is the client, and the connected service
provides the tools.

Set `BIPPY_MCP_ENCRYPTION_KEY` to 32 random bytes encoded as base64 and apply
migrations `0034` and `0035` before adding a connection. Connection secrets are
encrypted with AES-256-GCM and are never returned to the browser. Supported
connection types are unauthenticated HTTPS, bearer-token HTTPS, and OAuth.

OAuth connections use the MCP server's protected-resource and authorization
server discovery, dynamic client registration, signed ten-minute state, and
PKCE. The callback requires the signed-in portfolio administrator before it
exchanges the authorization code. Access tokens, refresh tokens, registered
client information, discovery state, and the temporary verifier are stored in
the encrypted connection record. Providers that issue refresh tokens are
refreshed automatically by the MCP transport. A server that does not support
dynamic client registration must use a bearer token or receive a dedicated
pre-registered provider adapter.

Saving a connection verifies the server and discovers its tools. Discovery
does not expose anything to the model. The administrator must separately
allowlist tools, classify genuinely non-mutating tools as read-only, and enable
the connection. Read-only calls execute immediately and are audited. Every
other call becomes a normal Bippy approval and is executed only after approval;
the connection and allowlist are checked again at execution time.

Generate the encryption key with `openssl rand -base64 32`. Rotating this key
requires reconnecting credentialed servers because existing ciphertext cannot
be decrypted with the replacement key.

## Private MCP connection

Bippy exposes the same controlled portfolio operations through a private
Streamable HTTP MCP resource. An external ChatGPT, Claude, or Codex client
supplies its own model; the portfolio supplies authenticated tools, validation,
auditing, and approvals. External clients never receive database, storage, or
OpenAI credentials.

The production connection URL is `MCP_RESOURCE_URL` (normally
`https://your-domain.example/api/mcp`). The client discovers OAuth through
`/.well-known/oauth-protected-resource`, registers as a public client, and uses
authorization code + PKCE. Only the authorized GitHub owner can approve the
connection. Access tokens expire after one hour, refresh tokens rotate on every
use, and only SHA-256 token hashes are stored. The advertised OAuth revocation
endpoint can revoke either token type without revealing whether a token existed.

Scopes:

- `portfolio:read` reads the overview and individual content records.
- `portfolio:draft` prepares private project, writing, and recognition drafts.
- `portfolio:propose` prepares edits, placement changes, deletions, Now changes,
  and SEO changes.

Every MCP write creates a pending proposal and returns its readable preview to
the connected MCP conversation. The owner can explicitly approve or reject it
there; the dedicated MCP approval queue remains an audit and recovery surface.
Existing admin actions perform the actual mutation after review; proposal tools
cannot publish, edit, or delete content directly.
After the owner reviews a proposal in the connected MCP conversation, the
owner may explicitly approve or reject that proposal through the MCP approval
tool. The tool is restricted to the same authenticated MCP connection that
created the proposal; publishing remains a separate action.

The **MCP** page in the main admin sidebar lists registered clients, their
callback origins, granted scopes, connection state, and last activity. Each
client has a dedicated, paginated **Activity** page with its complete external
tool-call audit history, including completion or failure and any resulting
approval status. Tool arguments, results, bearer tokens, and credentials are
never displayed. Disconnecting a client immediately revokes all of its access
and refresh tokens.

**Clean expired** is credential lifecycle maintenance, not an audit-log delete
action. It removes expired authorization codes and tokens, old revoked tokens,
and abandoned clients older than thirty days that have no usable credentials.
A recent client with valid credentials remains listed even if an authorization
or tool attempt failed; disconnect it first if its access should be revoked.

Connected clients can also request a five-minute signed upload slot for a PNG,
JPEG, or WebP project icon (2 MB maximum) or a PDF résumé (10 MB maximum). The
slot exposes no R2 credentials and binds the content type. Uploading an object
does not place it on the public site: Bippy must create a separate résumé or
icon proposal, and the owner must approve that proposal. Contact-link and
recognition-icon changes follow the same approval boundary. If an uploaded
résumé or project icon proposal is rejected or fails, the object is removed
only after the database confirms that no portfolio record references it.

Configure the production HTTPS origins after deployment:

```env
MCP_ENABLED=true
MCP_RESOURCE_URL=https://your-domain.example/api/mcp
MCP_AUTH_ISSUER=https://admin.your-domain.example
MCP_AUTHORIZATION_URL=https://admin.your-domain.example/mcp/authorize
MCP_MAINTENANCE_SECRET=replace-with-at-least-32-random-characters
```

Run `npm run db:migrate` before enabling the endpoint. Add `MCP_RESOURCE_URL`
as a custom remote MCP/plugin server in a compatible client. The client opens
the admin authorization page; sign in as the allowed GitHub owner, review the
scopes, and choose **Connect Bippy**. No OpenAI API key is used when ChatGPT is
the MCP client.

Configure the hosting scheduler to send a daily authenticated `POST` request
to `/api/internal/mcp/cleanup` with
`Authorization: Bearer $MCP_MAINTENANCE_SECRET`. The endpoint removes expired
authorization codes and tokens, revoked tokens retained for thirty days, and
clients older than thirty days that have no live credentials. It returns 404
when the maintenance secret is not configured.

## Conversation compaction

- Short conversations are replayed verbatim.
- When the conversation input crosses
  `OPENAI_COMPACTION_THRESHOLD_TOKENS` (20,000 by default), Bippy creates an
  incremental readable checkpoint and keeps the eight newest messages
  verbatim.
- The compaction decision uses OpenAI's input-token counting endpoint. A local
  conservative estimate is used only to avoid counting requests for clearly
  short threads.
- Checkpoints retain administrator decisions, current requirements, referenced
  content, completed tool results, pending approvals, failed actions, and open
  questions. The compactor has no portfolio tools.
- Original messages, tool calls, and approvals remain in Neon for the admin UI
  and audit history. Compaction changes model replay only.
- Curated cross-conversation memory remains separate and is never created by
  compaction.
- A transient compaction failure is logged and falls back to the uncompressed
  transcript rather than deleting context.

The private **Bippy → Token Analytics** page reports today, month, and all-time
input/output tokens; completed and failed runs; seven-day activity; usage by
model; and the reduction represented by current conversation checkpoints. It
uses the application audit tables and never exposes the API key. OpenAI billing
remains the authoritative source for charged usage.

## Permission model

- Every assistant page and API handler calls `requireAdmin`.
- Read tools can inspect only the portfolio data exposed by their named query.
- Creating an unpublished project, post, or recognition draft is automatic.
- Editing existing content, publishing, pinning, deletion, Now changes, and SEO
  changes create a pending approval. The mutation runs only when the owner
  clicks **Approve**.
- Approval execution calls the same validated admin actions as the forms.
- No tool exposes SQL, shell access, code execution, arbitrary HTTP requests,
  environment variables, authentication data, or raw storage deletion.

## Audit data

The application stores threads, messages, runs, tool calls, and approval
decisions in Neon. Model tracing is disabled by default because this database
audit trail is the source of truth. API keys and environment values are never
stored in the assistant tables.

Deleting a conversation cascades its messages, runs, tool calls, and approvals.
It does not undo portfolio mutations that were separately approved and applied.

## Curated memory

- Bippy receives saved memories in every conversation, independently of the
  latest 30 messages supplied from the current chat.
- A memory is created or updated only when the administrator explicitly asks
  Bippy to remember, save, or retain something for future chats.
- Ordinary conversation is never mined automatically for memories.
- Memories are labeled as preferences, facts, or instructions and are visible
  under **Bippy → Memory**.
- The owner can remove a memory from that screen after a confirmation. Asking
  Bippy to forget one creates an approval before deletion.
- Deleting the source conversation does not delete its curated memories.

## Adding another provider

Implement `PortfolioAssistantProvider` from `src/lib/ai/provider.ts`, then reuse
the tools returned by `createPortfolioTools`. A provider must preserve the same
server-only key handling, streaming event contract, admin authorization, and
approval policy. Do not add provider-specific mutation code.
