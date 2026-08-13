import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  auth,
  type OAuthClientProvider,
  type OAuthDiscoveryState,
} from "@modelcontextprotocol/sdk/client/auth.js";
import type {
  OAuthClientInformationMixed,
  OAuthClientMetadata,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import { tool, type RunContext, type Tool } from "@openai/agents";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  bippyMcpConnections,
  type BippyMcpConnection,
  type BippyMcpToolDefinition,
} from "@/db/schema";
import { getAuthorizedAdmin } from "@/lib/auth/server";
import { createApproval, recordToolCall } from "@/lib/ai/repository";
import type { PortfolioAgentContext } from "@/lib/ai/tools";
import { requireServerEnv } from "@/lib/env";

const connectionInputSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2).max(80),
  serverUrl: z
    .url()
    .refine((value) => new URL(value).protocol === "https:", "Use HTTPS."),
  authType: z.enum(["none", "bearer", "oauth"]),
  credential: z.string().trim().max(8_000).optional(),
});

const toolSettingsSchema = z.object({
  id: z.uuid(),
  enabled: z.boolean(),
  allowedTools: z.array(z.string().min(1).max(200)).max(100),
  readOnlyTools: z.array(z.string().min(1).max(200)).max(100),
});

export type BippyMcpConnectionInput = z.infer<typeof connectionInputSchema>;
export type BippyMcpToolSettingsInput = z.infer<typeof toolSettingsSchema>;
export type BippyMcpConnectionView = Omit<
  BippyMcpConnection,
  "encryptedCredential"
> & { hasCredential: boolean; oauthConnected: boolean };

type StoredOAuthData = {
  redirectUrl: string;
  clientInformation?: OAuthClientInformationMixed;
  tokens?: OAuthTokens;
  codeVerifier?: string;
  discoveryState?: OAuthDiscoveryState;
};

function encryptionKey() {
  const value = requireServerEnv(
    "BIPPY_MCP_ENCRYPTION_KEY",
  ).BIPPY_MCP_ENCRYPTION_KEY;
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) {
    throw new Error(
      "BIPPY_MCP_ENCRYPTION_KEY must decode to exactly 32 bytes.",
    );
  }
  return key;
}

function encryptCredential(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function decryptCredential(value: string) {
  const [version, iv, tag, encrypted] = value.split(".");
  if (version !== "v1" || !iv || !tag || !encrypted) {
    throw new Error("The stored MCP credential is invalid.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function encryptOAuthData(value: StoredOAuthData) {
  return encryptCredential(JSON.stringify(value));
}

function decryptOAuthData(value: string | null): StoredOAuthData {
  if (!value) throw new Error("This OAuth connection has no saved session.");
  return z
    .object({
      redirectUrl: z.url(),
      clientInformation: z.record(z.string(), z.unknown()).optional(),
      tokens: z.record(z.string(), z.unknown()).optional(),
      codeVerifier: z.string().optional(),
      discoveryState: z.record(z.string(), z.unknown()).optional(),
    })
    .parse(JSON.parse(decryptCredential(value))) as StoredOAuthData;
}

function oauthState(connectionId: string) {
  const issuedAt = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(18).toString("base64url");
  const payload = `${connectionId}.${issuedAt}.${nonce}`;
  const signature = createHmac("sha256", encryptionKey())
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

function connectionIdFromOAuthState(state: string) {
  const parts = state.split(".");
  if (parts.length !== 4) throw new Error("Invalid OAuth state.");
  const [connectionId, issuedAt, nonce, signature] = parts;
  z.uuid().parse(connectionId);
  if (!/^\d+$/.test(issuedAt) || !nonce || !signature) {
    throw new Error("Invalid OAuth state.");
  }
  const age = Math.floor(Date.now() / 1000) - Number(issuedAt);
  if (age < 0 || age > 10 * 60) throw new Error("The OAuth request expired.");
  const expected = createHmac("sha256", encryptionKey())
    .update(`${connectionId}.${issuedAt}.${nonce}`)
    .digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error("Invalid OAuth state.");
  }
  return connectionId;
}

function connectionView(row: BippyMcpConnection): BippyMcpConnectionView {
  const { encryptedCredential, ...safe } = row;
  let oauthConnected = false;
  if (row.authType === "oauth" && encryptedCredential) {
    try {
      oauthConnected = Boolean(
        decryptOAuthData(encryptedCredential).tokens?.access_token,
      );
    } catch {
      oauthConnected = false;
    }
  }
  return {
    ...safe,
    hasCredential: Boolean(encryptedCredential),
    oauthConnected,
  };
}

export async function listBippyMcpConnections() {
  const rows = await getDb()
    .select()
    .from(bippyMcpConnections)
    .orderBy(asc(bippyMcpConnections.name));
  return rows.map(connectionView);
}

type McpConnectionConfig = Pick<
  BippyMcpConnection,
  "serverUrl" | "authType" | "encryptedCredential"
> & { id?: string };

function requestHeaders(connection: McpConnectionConfig) {
  if (connection.authType !== "bearer") return undefined;
  if (!connection.encryptedCredential) {
    throw new Error("This connection is missing its bearer token.");
  }
  return {
    Authorization: `Bearer ${decryptCredential(connection.encryptedCredential)}`,
  };
}

class PersistedOAuthProvider implements OAuthClientProvider {
  authorizationUrl?: URL;
  private data: StoredOAuthData;

  constructor(
    private connection: McpConnectionConfig & { id: string },
  ) {
    this.data = decryptOAuthData(connection.encryptedCredential);
  }

  get redirectUrl() {
    return this.data.redirectUrl;
  }

  get clientMetadata(): OAuthClientMetadata {
    return {
      client_name: "Ameenfolio Bippy",
      redirect_uris: [this.data.redirectUrl],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    };
  }

  state() {
    return oauthState(this.connection.id);
  }

  clientInformation() {
    return this.data.clientInformation;
  }

  async saveClientInformation(value: OAuthClientInformationMixed) {
    this.data.clientInformation = value;
    await this.persist();
  }

  tokens() {
    return this.data.tokens;
  }

  async saveTokens(value: OAuthTokens) {
    this.data.tokens = value;
    await this.persist();
  }

  redirectToAuthorization(url: URL) {
    this.authorizationUrl = url;
  }

  async saveCodeVerifier(value: string) {
    this.data.codeVerifier = value;
    await this.persist();
  }

  codeVerifier() {
    if (!this.data.codeVerifier)
      throw new Error("Missing OAuth code verifier.");
    return this.data.codeVerifier;
  }

  async saveDiscoveryState(value: OAuthDiscoveryState) {
    this.data.discoveryState = value;
    await this.persist();
  }

  discoveryState() {
    return this.data.discoveryState;
  }

  async invalidateCredentials(
    scope: "all" | "client" | "tokens" | "verifier" | "discovery",
  ) {
    if (scope === "all" || scope === "client")
      delete this.data.clientInformation;
    if (scope === "all" || scope === "tokens") delete this.data.tokens;
    if (scope === "all" || scope === "verifier") delete this.data.codeVerifier;
    if (scope === "all" || scope === "discovery")
      delete this.data.discoveryState;
    await this.persist();
  }

  private async persist() {
    const encryptedCredential = encryptOAuthData(this.data);
    this.connection = { ...this.connection, encryptedCredential };
    await getDb()
      .update(bippyMcpConnections)
      .set({ encryptedCredential, updatedAt: new Date() })
      .where(eq(bippyMcpConnections.id, this.connection.id));
  }
}

async function withMcpClient<T>(
  connection: McpConnectionConfig,
  execute: (client: Client) => Promise<T>,
) {
  const client = new Client({ name: "ameenfolio-bippy", version: "1.0.0" });
  if (connection.authType === "oauth" && !connection.id) {
    throw new Error("OAuth connection is missing its identifier.");
  }
  const transport = new StreamableHTTPClientTransport(
    new URL(connection.serverUrl),
    connection.authType === "oauth"
      ? {
          authProvider: new PersistedOAuthProvider({
            ...connection,
            id: connection.id,
          }),
        }
      : { requestInit: { headers: requestHeaders(connection) } },
  );
  try {
    await client.connect(transport, { timeout: 15_000 });
    return await execute(client);
  } finally {
    await client.close().catch(() => undefined);
  }
}

function normalizeTools(
  tools: Awaited<ReturnType<Client["listTools"]>>["tools"],
): BippyMcpToolDefinition[] {
  return tools
    .filter((item) => item.name.length > 0 && item.name.length <= 200)
    .slice(0, 100)
    .map((item) => ({
      name: item.name,
      title: item.title?.slice(0, 200),
      description: item.description?.slice(0, 2_000),
      inputSchema: item.inputSchema,
      readOnlyHint: item.annotations?.readOnlyHint === true,
    }));
}

async function discoverTools(connection: McpConnectionConfig) {
  return withMcpClient(connection, async (client) =>
    normalizeTools(
      (await client.listTools(undefined, { timeout: 15_000 })).tools,
    ),
  );
}

export async function saveAndDiscoverBippyMcpConnection(
  input: BippyMcpConnectionInput,
) {
  const values = connectionInputSchema.parse(input);
  if (values.authType === "oauth") {
    throw new Error("OAuth connections must use the authorization flow.");
  }
  const db = getDb();
  const existing = values.id
    ? (
        await db
          .select()
          .from(bippyMcpConnections)
          .where(eq(bippyMcpConnections.id, values.id))
          .limit(1)
      )[0]
    : undefined;
  if (values.id && !existing) throw new Error("MCP connection not found.");
  const encryptedCredential = values.credential
    ? encryptCredential(values.credential)
    : values.authType === "none"
      ? null
      : existing?.authType === values.authType
        ? existing.encryptedCredential
        : null;
  if (values.authType === "bearer" && !encryptedCredential) {
    throw new Error("Enter a bearer token for this connection.");
  }

  const pending: McpConnectionConfig = {
    serverUrl: values.serverUrl,
    authType: values.authType,
    encryptedCredential: encryptedCredential ?? null,
  };

  try {
    const discoveredTools = await discoverTools(pending);
    const now = new Date();
    const rowValues = {
      name: values.name,
      serverUrl: values.serverUrl,
      authType: values.authType,
      encryptedCredential: encryptedCredential ?? null,
      discoveredTools,
      allowedTools: existing
        ? existing.allowedTools.filter((name) =>
            discoveredTools.some((item) => item.name === name),
          )
        : [],
      readOnlyTools: existing
        ? existing.readOnlyTools.filter((name) =>
            discoveredTools.some((item) => item.name === name),
          )
        : discoveredTools
            .filter((item) => item.readOnlyHint)
            .map((item) => item.name),
      lastConnectedAt: now,
      lastError: null,
      updatedAt: now,
    };
    const [saved] = existing
      ? await db
          .update(bippyMcpConnections)
          .set(rowValues)
          .where(eq(bippyMcpConnections.id, existing.id))
          .returning()
      : await db.insert(bippyMcpConnections).values(rowValues).returning();
    return connectionView(saved);
  } catch (error) {
    if (existing) {
      await db
        .update(bippyMcpConnections)
        .set({ lastError: String(error), updatedAt: new Date() })
        .where(eq(bippyMcpConnections.id, existing.id));
    }
    throw error;
  }
}

export async function beginBippyMcpOAuth(
  input: BippyMcpConnectionInput,
  redirectUrl: string,
) {
  const values = connectionInputSchema.parse(input);
  if (values.authType !== "oauth") {
    throw new Error("This is not an OAuth connection.");
  }
  const db = getDb();
  const existing = values.id
    ? (
        await db
          .select()
          .from(bippyMcpConnections)
          .where(eq(bippyMcpConnections.id, values.id))
          .limit(1)
      )[0]
    : undefined;
  if (values.id && !existing) throw new Error("MCP connection not found.");

  let previous: StoredOAuthData | undefined;
  if (existing?.authType === "oauth" && existing.encryptedCredential) {
    previous = decryptOAuthData(existing.encryptedCredential);
  }
  const data: StoredOAuthData = {
    redirectUrl,
    clientInformation:
      existing?.serverUrl === values.serverUrl
        ? previous?.clientInformation
        : undefined,
    discoveryState:
      existing?.serverUrl === values.serverUrl
        ? previous?.discoveryState
        : undefined,
  };
  const rowValues = {
    name: values.name,
    serverUrl: values.serverUrl,
    authType: "oauth",
    encryptedCredential: encryptOAuthData(data),
    enabled: false,
    allowedTools: [] as string[],
    readOnlyTools: [] as string[],
    discoveredTools: [] as BippyMcpToolDefinition[],
    lastConnectedAt: null,
    lastError: null,
    updatedAt: new Date(),
  };
  const [connection] = existing
    ? await db
        .update(bippyMcpConnections)
        .set(rowValues)
        .where(eq(bippyMcpConnections.id, existing.id))
        .returning()
    : await db.insert(bippyMcpConnections).values(rowValues).returning();

  try {
    const provider = new PersistedOAuthProvider(connection);
    const result = await auth(provider, { serverUrl: connection.serverUrl });
    if (result !== "REDIRECT" || !provider.authorizationUrl) {
      throw new Error(
        "The MCP server did not provide an OAuth authorization URL.",
      );
    }
    return {
      connection: connectionView(connection),
      authorizationUrl: provider.authorizationUrl.toString(),
    };
  } catch (error) {
    await db
      .update(bippyMcpConnections)
      .set({ lastError: String(error), updatedAt: new Date() })
      .where(eq(bippyMcpConnections.id, connection.id));
    throw error;
  }
}

export async function finishBippyMcpOAuth(state: string, code: string) {
  const connectionId = connectionIdFromOAuthState(state);
  const [connection] = await getDb()
    .select()
    .from(bippyMcpConnections)
    .where(eq(bippyMcpConnections.id, connectionId))
    .limit(1);
  if (!connection || connection.authType !== "oauth") {
    throw new Error("OAuth connection not found.");
  }

  try {
    const provider = new PersistedOAuthProvider(connection);
    const result = await auth(provider, {
      serverUrl: connection.serverUrl,
      authorizationCode: code,
    });
    if (result !== "AUTHORIZED") throw new Error("OAuth authorization failed.");

    const refreshed = (
      await getDb()
        .select()
        .from(bippyMcpConnections)
        .where(eq(bippyMcpConnections.id, connection.id))
        .limit(1)
    )[0];
    const discoveredTools = await discoverTools(refreshed);
    const [saved] = await getDb()
      .update(bippyMcpConnections)
      .set({
        discoveredTools,
        readOnlyTools: discoveredTools
          .filter((tool) => tool.readOnlyHint)
          .map((tool) => tool.name),
        lastConnectedAt: new Date(),
        lastError: null,
        updatedAt: new Date(),
      })
      .where(eq(bippyMcpConnections.id, connection.id))
      .returning();
    return connectionView(saved);
  } catch (error) {
    await getDb()
      .update(bippyMcpConnections)
      .set({ lastError: String(error), updatedAt: new Date() })
      .where(eq(bippyMcpConnections.id, connection.id));
    throw error;
  }
}

export async function updateBippyMcpToolSettings(
  input: BippyMcpToolSettingsInput,
) {
  const values = toolSettingsSchema.parse(input);
  const [connection] = await getDb()
    .select()
    .from(bippyMcpConnections)
    .where(eq(bippyMcpConnections.id, values.id))
    .limit(1);
  if (!connection) throw new Error("MCP connection not found.");
  const discovered = new Set(
    connection.discoveredTools.map((tool) => tool.name),
  );
  const allowedTools = [...new Set(values.allowedTools)].filter((name) =>
    discovered.has(name),
  );
  const readOnlyTools = [...new Set(values.readOnlyTools)].filter((name) =>
    allowedTools.includes(name),
  );
  const [saved] = await getDb()
    .update(bippyMcpConnections)
    .set({
      enabled: values.enabled && allowedTools.length > 0,
      allowedTools,
      readOnlyTools,
      updatedAt: new Date(),
    })
    .where(eq(bippyMcpConnections.id, values.id))
    .returning();
  return connectionView(saved);
}

export async function deleteBippyMcpConnection(id: string) {
  const parsed = z.uuid().parse(id);
  const deleted = await getDb()
    .delete(bippyMcpConnections)
    .where(eq(bippyMcpConnections.id, parsed))
    .returning({ id: bippyMcpConnections.id });
  return Boolean(deleted[0]);
}

function safeArguments(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function compactResult(value: unknown) {
  const serialized = JSON.stringify(value);
  if (serialized.length <= 24_000) return value;
  return { truncated: true, content: serialized.slice(0, 24_000) };
}

export async function executeBippyMcpTool(
  connectionId: string,
  toolName: string,
  args: Record<string, unknown>,
  requireReadOnly = false,
) {
  const [connection] = await getDb()
    .select()
    .from(bippyMcpConnections)
    .where(
      and(
        eq(bippyMcpConnections.id, connectionId),
        eq(bippyMcpConnections.enabled, true),
      ),
    )
    .limit(1);
  if (!connection || !connection.allowedTools.includes(toolName)) {
    throw new Error("That MCP tool is no longer enabled for Bippy.");
  }
  if (requireReadOnly && !connection.readOnlyTools.includes(toolName)) {
    throw new Error("That MCP tool now requires administrator approval.");
  }
  return withMcpClient(connection, async (client) =>
    compactResult(
      await client.callTool({ name: toolName, arguments: args }, undefined, {
        timeout: 30_000,
      }),
    ),
  );
}

function agentToolName(connection: BippyMcpConnection, toolName: string) {
  const safe = toolName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32);
  const hash = createHash("sha256").update(toolName).digest("hex").slice(0, 8);
  return `mcp_${connection.id.slice(0, 8)}_${safe}_${hash}`;
}

export async function createBippyMcpTools(): Promise<
  Tool<PortfolioAgentContext>[]
> {
  const connections = await getDb()
    .select()
    .from(bippyMcpConnections)
    .where(eq(bippyMcpConnections.enabled, true));

  return connections.flatMap((connection) =>
    connection.discoveredTools
      .filter((definition) => connection.allowedTools.includes(definition.name))
      .map((definition) => {
        const parameters: {
          type: "object";
          properties: Record<string, object>;
          required: string[];
          additionalProperties: true;
          description?: string;
        } = {
          type: "object",
          properties: definition.inputSchema.properties ?? {},
          required: definition.inputSchema.required ?? [],
          additionalProperties: true,
        };
        return tool({
          name: agentToolName(connection, definition.name),
          description: `${definition.description ?? definition.title ?? definition.name} (via ${connection.name})`,
          parameters,
          strict: false,
          timeoutMs: 35_000,
          execute: async (
            input,
            runContext?: RunContext<PortfolioAgentContext>,
          ) => {
            if (!(await getAuthorizedAdmin()) || !runContext?.context) {
              throw new Error("Administrator authorization is required.");
            }
            const args = safeArguments(input);
            const owner = runContext.context;
            const readOnly = connection.readOnlyTools.includes(definition.name);
            const { result } = await recordToolCall({
              threadId: owner.threadId,
              runId: owner.runId,
              toolName: `${connection.name}: ${definition.name}`,
              arguments: args,
              requiresApproval: !readOnly,
              onChange: owner.onToolChange,
              execute: async (call) => {
                if (readOnly) {
                  return executeBippyMcpTool(
                    connection.id,
                    definition.name,
                    args,
                    true,
                  );
                }
                const approval = await createApproval({
                  threadId: owner.threadId,
                  runId: owner.runId,
                  toolCallId: call.id,
                  actionType: "execute_bippy_mcp_tool",
                  payload: {
                    connectionId: connection.id,
                    toolName: definition.name,
                    arguments: args,
                  },
                  preview: {
                    connection: connection.name,
                    tool: definition.name,
                    arguments: args,
                  },
                });
                owner.approvals.push(approval);
                return {
                  approvalId: approval.id,
                  status: "pending",
                  message:
                    "The administrator must approve this external action.",
                };
              },
            });
            return result;
          },
        });
      }),
  );
}
