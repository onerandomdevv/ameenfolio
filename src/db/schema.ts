import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { Availability } from "@/config/availability";
import type { PostLinkIconName } from "@/config/post-link-icons";
import type { ProjectIconName } from "@/config/project-icons";
import type { RecognitionIconName } from "@/config/recognition-icons";
import type { TechStackGroupValue } from "@/config/tech-stack";

export type ContactLinks = {
  github?: string;
  x?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  whatsapp?: string;
};

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    shortDescription: text("short_description").notNull(),
    contribution: text("contribution"),
    statusLabel: text("status_label"),
    // One destination per project: clicking the card follows this. The
    // physical column keeps its old name so the rename costs no migration,
    // the same trade already made for contactLinks/social_links below.
    url: text("live_url").notNull(),
    iconKey: text("icon_key"),
    iconAlt: text("icon_alt"),
    iconName: text("icon_name")
      .$type<ProjectIconName>()
      .notNull()
      .default("custom"),
    // Pinning is the only placement control. A timestamp rather than a
    // boolean plus an integer: what the homepage needs is an order, and the
    // moment something was pinned already is one. Null means not pinned.
    pinnedAt: timestamp("pinned_at", { withTimezone: true }),
    published: boolean("published").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index("projects_published_idx").on(table.published),
    index("projects_pinned_idx").on(table.published, table.pinnedAt),
    check(
      "projects_icon_name_valid",
      sql`${table.iconName} in ('custom', 'github', 'web')`,
    ),
    check(
      "projects_icon_alt_required",
      sql`${table.iconKey} is null or length(trim(${table.iconAlt})) > 0`,
    ),
  ],
);

export const recognitions = pgTable(
  "recognitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    iconName: text("icon_name")
      .$type<RecognitionIconName>()
      .notNull()
      .default("trophy"),
    verificationUrl: text("verification_url"),
    // Same as projects: pinned ones show on the homepage, newest pin first,
    // capped at twelve by the recognitions_pinned_limit trigger. The full list
    // lives on the writing page.
    pinnedAt: timestamp("pinned_at", { withTimezone: true }),
    published: boolean("published").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index("recognitions_public_idx").on(table.published, table.pinnedAt),
    check(
      "recognitions_icon_name_valid",
      sql`${table.iconName} in ('trophy', 'award', 'medal', 'star', 'badge-check', 'crown', 'sparkles', 'github', 'x', 'instagram', 'tiktok', 'linkedin', 'whatsapp', 'youtube', 'globe')`,
    ),
  ],
);

export const techStackItems = pgTable(
  "tech_stack_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    groupKey: text("group_key").$type<TechStackGroupValue>().notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    visible: boolean("visible").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    index("tech_stack_public_idx").on(
      table.visible,
      table.groupKey,
      table.displayOrder,
    ),
    check(
      "tech_stack_group_key_valid",
      sql`${table.groupKey} in ('core', 'tools')`,
    ),
  ],
);

export const nowSection = pgTable(
  "now_section",
  {
    id: integer("id").primaryKey().default(1),
    description: text("description").notNull(),
    published: boolean("published").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [check("now_section_singleton", sql`${table.id} = 1`)],
);

export const nowLinks = pgTable(
  "now_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    label: text("label").notNull(),
    url: text("url").notNull(),
    iconKey: text("icon_key"),
    iconAlt: text("icon_alt"),
    // The brand mark shown when no image is uploaded. 'web' is the globe.
    iconName: text("icon_name").notNull().default("web"),
    displayOrder: integer("display_order").notNull().default(0),
    visible: boolean("visible").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    index("now_links_visible_order_idx").on(table.visible, table.displayOrder),
    check(
      "now_links_icon_alt_required",
      sql`${table.iconKey} is null or length(trim(${table.iconAlt})) > 0`,
    ),
    check(
      "now_links_icon_name_known",
      sql`${table.iconName} in ('web', 'github', 'x', 'instagram', 'youtube')`,
    ),
  ],
);

export const siteSettings = pgTable(
  "site_settings",
  {
    id: integer("id").primaryKey().default(1),
    email: text("email").notNull(),
    // Keep the legacy physical column name so existing deployments retain data.
    contactLinks: jsonb("social_links")
      .$type<ContactLinks>()
      .notNull()
      .default({}),
    // NULL means never edited, so the copy in src/config/portfolio.ts keeps
    // supplying it and the wording lives in one place until then.
    displayName: text("display_name"),
    role: text("role"),
    introduction: text("introduction"),
    profileImageKey: text("profile_image_key"),
    resumeKey: text("resume_key"),
    resumeFilename: text("resume_filename"),
    publicBippyEnabled: boolean("public_bippy_enabled").notNull().default(true),
    hackathonWins: integer("hackathon_wins").notNull().default(0),
    availability: text("availability")
      .$type<Availability>()
      .notNull()
      .default("open"),
    seoTitle: text("seo_title").notNull(),
    seoDescription: text("seo_description").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("site_settings_singleton", sql`${table.id} = 1`),
    check(
      "site_settings_availability_valid",
      sql`${table.availability} in ('open', 'booked')`,
    ),
  ],
);

// A single cached row rather than a live fetch on render. The public pages are
// force-dynamic, so calling GitHub per request would put the homepage's speed
// at the mercy of api.github.com and burn the hourly rate limit under any real
// traffic. Readers serve whatever is here and refresh it out of band.
export const statsSnapshot = pgTable(
  "stats_snapshot",
  {
    id: integer("id").primaryKey().default(1),
    contributions: integer("contributions").notNull().default(0),
    currentStreak: integer("current_streak").notNull().default(0),
    currentStreakStart: timestamp("current_streak_start", {
      withTimezone: true,
    }),
    currentStreakEnd: timestamp("current_streak_end", { withTimezone: true }),
    longestStreak: integer("longest_streak").notNull().default(0),
    longestStreakStart: timestamp("longest_streak_start", {
      withTimezone: true,
    }),
    longestStreakEnd: timestamp("longest_streak_end", { withTimezone: true }),
    firstContributionAt: timestamp("first_contribution_at", {
      withTimezone: true,
    }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [check("stats_snapshot_singleton", sql`${table.id} = 1`)],
);

// A heading lifted out of the rendered body so the post page can build its
// contents list without re-parsing the markup on every request.
export type PostHeading = {
  id: string;
  text: string;
  level: number;
};

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    // Both forms are stored: the markdown is what the owner edits, the HTML is
    // what the page serves. Public pages are force-dynamic, so rendering on
    // read would re-parse the same post on every visit for a result that only
    // changes when it is saved.
    bodyMarkdown: text("body_markdown").notNull(),
    bodyHtml: text("body_html").notNull(),
    headings: jsonb("headings").$type<PostHeading[]>().notNull().default([]),
    // Separate from createdAt because the date on the post is editorial — a
    // piece written over a week is dated when it went out, not when the row
    // first appeared.
    publishedAt: timestamp("published_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    published: boolean("published").notNull().default(false),
    pinnedAt: timestamp("pinned_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("posts_slug_idx").on(table.slug),
    index("posts_published_idx").on(table.published, table.publishedAt),
    index("posts_pinned_idx").on(table.published, table.pinnedAt),
    check(
      "posts_slug_shape",
      sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`,
    ),
  ],
);

// Where a post points when it is finished — the repository, the video, the
// thread. Cascades, because a link has no meaning without the post it closes.
export const postLinks = pgTable(
  "post_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    url: text("url").notNull(),
    iconName: text("icon_name")
      .$type<PostLinkIconName>()
      .notNull()
      .default("link"),
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("post_links_post_order_idx").on(table.postId, table.displayOrder),
  ],
);

// Conversations and audit records for the private portfolio copilot. The AI
// never owns application data: it can read through scoped tools and record a
// proposed mutation here, while the existing admin actions remain the only
// code allowed to change portfolio content.
export const agentThreads = pgTable(
  "agent_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull().default("New conversation"),
    provider: text("provider").notNull().default("openai"),
    model: text("model").notNull().default("gpt-5.4-mini"),
    kind: text("kind").notNull().default("chat"),
    pinnedAt: timestamp("pinned_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("agent_threads_updated_idx").on(table.updatedAt),
    index("agent_threads_pinned_idx").on(table.pinnedAt),
    index("agent_threads_kind_updated_idx").on(table.kind, table.updatedAt),
    check(
      "agent_threads_kind_valid",
      sql`${table.kind} in ('chat', 'mcp_audit')`,
    ),
  ],
);

// Deliberately curated cross-conversation memory for Bippy. Memories are
// separate from chat history so deleting a conversation does not silently
// erase an explicit preference, and each item can be reviewed or forgotten.
export const agentMemories = pgTable(
  "agent_memories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    label: text("label").notNull(),
    content: text("content").notNull(),
    category: text("category").notNull().default("preference"),
    sourceThreadId: uuid("source_thread_id").references(() => agentThreads.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("agent_memories_label_unique").on(table.label),
    index("agent_memories_updated_idx").on(table.updatedAt),
    check(
      "agent_memories_category_valid",
      sql`${table.category} in ('preference', 'fact', 'instruction')`,
    ),
  ],
);

// A readable, incremental checkpoint for long Bippy conversations. Original
// messages remain untouched; this row only controls what is replayed to the
// model when the verbatim transcript crosses the configured token budget.
export const agentCompactions = pgTable(
  "agent_compactions",
  {
    threadId: uuid("thread_id")
      .primaryKey()
      .references(() => agentThreads.id, { onDelete: "cascade" }),
    summary: text("summary").notNull(),
    compactedMessageCount: integer("compacted_message_count").notNull(),
    sourceTokens: integer("source_tokens").notNull(),
    summaryTokens: integer("summary_tokens").notNull(),
    ...timestamps,
  },
  (table) => [
    check(
      "agent_compactions_message_count_valid",
      sql`${table.compactedMessageCount} >= 0`,
    ),
    check(
      "agent_compactions_token_counts_valid",
      sql`${table.sourceTokens} >= 0 and ${table.summaryTokens} >= 0`,
    ),
  ],
);

export const agentRuns = pgTable(
  "agent_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => agentThreads.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    status: text("status").notNull().default("running"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => [
    index("agent_runs_thread_idx").on(table.threadId, table.startedAt),
    check(
      "agent_runs_status_valid",
      sql`${table.status} in ('running', 'completed', 'failed')`,
    ),
  ],
);

export const agentMessages = pgTable(
  "agent_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => agentThreads.id, { onDelete: "cascade" }),
    runId: uuid("run_id").references(() => agentRuns.id, {
      onDelete: "set null",
    }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("agent_messages_thread_idx").on(table.threadId, table.createdAt),
    check(
      "agent_messages_role_valid",
      sql`${table.role} in ('user', 'assistant')`,
    ),
  ],
);

export const agentToolCalls = pgTable(
  "agent_tool_calls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => agentThreads.id, { onDelete: "cascade" }),
    runId: uuid("run_id")
      .notNull()
      .references(() => agentRuns.id, { onDelete: "cascade" }),
    toolName: text("tool_name").notNull(),
    arguments: jsonb("arguments").$type<Record<string, unknown>>().notNull(),
    result: jsonb("result").$type<unknown>(),
    status: text("status").notNull(),
    requiresApproval: boolean("requires_approval").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => [
    index("agent_tool_calls_run_idx").on(table.runId),
    index("agent_tool_calls_thread_idx").on(table.threadId, table.createdAt),
    check(
      "agent_tool_calls_status_valid",
      sql`${table.status} in ('running', 'completed', 'failed')`,
    ),
  ],
);

export const agentApprovals = pgTable(
  "agent_approvals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => agentThreads.id, { onDelete: "cascade" }),
    runId: uuid("run_id")
      .notNull()
      .references(() => agentRuns.id, { onDelete: "cascade" }),
    toolCallId: uuid("tool_call_id")
      .notNull()
      .references(() => agentToolCalls.id, { onDelete: "cascade" }),
    actionType: text("action_type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    preview: jsonb("preview").$type<Record<string, unknown>>().notNull(),
    status: text("status").notNull().default("pending"),
    resolutionNote: text("resolution_note"),
    requestedAt: timestamp("requested_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    index("agent_approvals_thread_idx").on(table.threadId, table.requestedAt),
    check(
      "agent_approvals_status_valid",
      sql`${table.status} in ('pending', 'approved', 'rejected', 'executed', 'failed')`,
    ),
  ],
);

export type BippyMcpToolDefinition = {
  name: string;
  title?: string;
  description?: string;
  inputSchema: {
    type: "object";
    properties?: Record<string, object>;
    required?: string[];
    [key: string]: unknown;
  };
  readOnlyHint: boolean;
};

// Remote MCP servers that Bippy may call. This is deliberately separate from
// the mcp_oauth_* tables below: those describe clients connecting into
// Ameenfolio, while these rows describe services Bippy connects out to.
export const bippyMcpConnections = pgTable(
  "bippy_mcp_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    serverUrl: text("server_url").notNull(),
    authType: text("auth_type").notNull().default("none"),
    encryptedCredential: text("encrypted_credential"),
    enabled: boolean("enabled").notNull().default(false),
    allowedTools: jsonb("allowed_tools")
      .$type<string[]>()
      .notNull()
      .default([]),
    readOnlyTools: jsonb("read_only_tools")
      .$type<string[]>()
      .notNull()
      .default([]),
    discoveredTools: jsonb("discovered_tools")
      .$type<BippyMcpToolDefinition[]>()
      .notNull()
      .default([]),
    lastConnectedAt: timestamp("last_connected_at", { withTimezone: true }),
    lastError: text("last_error"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("bippy_mcp_connections_url_unique").on(table.serverUrl),
    index("bippy_mcp_connections_enabled_idx").on(table.enabled),
    check(
      "bippy_mcp_connections_auth_type_valid",
      sql`${table.authType} in ('none', 'bearer', 'oauth')`,
    ),
  ],
);

// OAuth state for the private Bippy MCP resource. Only hashes of authorization
// codes and bearer tokens are stored; a database leak cannot turn these rows
// into usable credentials. Clients are public PKCE clients, so no client
// secret is issued or persisted.
export const mcpOAuthClients = pgTable(
  "mcp_oauth_clients",
  {
    clientId: text("client_id").primaryKey(),
    clientName: text("client_name").notNull(),
    redirectUris: jsonb("redirect_uris").$type<string[]>().notNull(),
    threadId: uuid("thread_id").references(() => agentThreads.id, {
      onDelete: "set null",
    }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("mcp_oauth_clients_created_idx").on(table.createdAt),
    index("mcp_oauth_clients_last_used_idx").on(table.lastUsedAt),
  ],
);

export const agentMediaUploads = pgTable(
  "agent_media_uploads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    objectKey: text("object_key").notNull(),
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    clientId: text("client_id").references(() => mcpOAuthClients.clientId, {
      onDelete: "set null",
    }),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("agent_media_uploads_object_key_unique").on(table.objectKey),
    index("agent_media_uploads_created_idx").on(table.createdAt),
    check("agent_media_uploads_byte_size_positive", sql`${table.byteSize} > 0`),
    check(
      "agent_media_uploads_status_valid",
      sql`${table.status} in ('pending', 'ready', 'deleting', 'deleted')`,
    ),
  ],
);

export const mcpOAuthCodes = pgTable(
  "mcp_oauth_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    codeHash: text("code_hash").notNull(),
    clientId: text("client_id")
      .notNull()
      .references(() => mcpOAuthClients.clientId, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    ownerGithubUserId: text("owner_github_user_id").notNull(),
    redirectUri: text("redirect_uri").notNull(),
    codeChallenge: text("code_challenge").notNull(),
    resource: text("resource").notNull(),
    scopes: jsonb("scopes").$type<string[]>().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("mcp_oauth_codes_hash_unique").on(table.codeHash),
    index("mcp_oauth_codes_expiry_idx").on(table.expiresAt),
  ],
);

export const mcpOAuthTokens = pgTable(
  "mcp_oauth_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accessTokenHash: text("access_token_hash").notNull(),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    clientId: text("client_id")
      .notNull()
      .references(() => mcpOAuthClients.clientId, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    ownerGithubUserId: text("owner_github_user_id").notNull(),
    resource: text("resource").notNull(),
    scopes: jsonb("scopes").$type<string[]>().notNull(),
    accessExpiresAt: timestamp("access_expires_at", {
      withTimezone: true,
    }).notNull(),
    refreshExpiresAt: timestamp("refresh_expires_at", {
      withTimezone: true,
    }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("mcp_oauth_tokens_access_unique").on(table.accessTokenHash),
    uniqueIndex("mcp_oauth_tokens_refresh_unique").on(table.refreshTokenHash),
    index("mcp_oauth_tokens_access_expiry_idx").on(table.accessExpiresAt),
  ],
);

export type Project = typeof projects.$inferSelect;
export type Recognition = typeof recognitions.$inferSelect;
export type NowSection = typeof nowSection.$inferSelect;
export type NowLink = typeof nowLinks.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type StatsSnapshot = typeof statsSnapshot.$inferSelect;
export type TechStackItem = typeof techStackItems.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type PostLink = typeof postLinks.$inferSelect;
export type AgentThread = typeof agentThreads.$inferSelect;
export type AgentMemory = typeof agentMemories.$inferSelect;
export type AgentCompaction = typeof agentCompactions.$inferSelect;
export type AgentMessage = typeof agentMessages.$inferSelect;
export type AgentRun = typeof agentRuns.$inferSelect;
export type AgentToolCall = typeof agentToolCalls.$inferSelect;
export type AgentApproval = typeof agentApprovals.$inferSelect;
export type AgentMediaUpload = typeof agentMediaUploads.$inferSelect;
export type BippyMcpConnection = typeof bippyMcpConnections.$inferSelect;
export type McpOAuthClient = typeof mcpOAuthClients.$inferSelect;
export type McpOAuthCode = typeof mcpOAuthCodes.$inferSelect;
export type McpOAuthToken = typeof mcpOAuthTokens.$inferSelect;
