import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { and, count, eq, gt, gte, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  agentThreads,
  mcpOAuthClients,
  mcpOAuthCodes,
  mcpOAuthTokens,
} from "@/db/schema";
import { getServerEnv } from "@/lib/env";
import { getMcpConfig } from "@/lib/mcp/config";
import { touchMcpClient } from "@/lib/mcp/connections";
import {
  authorizationRequestSchema,
  clientRegistrationSchema,
  OAuthError,
  parseMcpScopes,
  verifyMcpPkce,
} from "@/lib/mcp/oauth-validation";

export {
  authorizationRequestSchema,
  clientRegistrationSchema,
  OAuthError,
} from "@/lib/mcp/oauth-validation";

const ACCESS_TOKEN_SECONDS = 60 * 60;
const REFRESH_TOKEN_SECONDS = 60 * 60 * 24 * 30;
const CODE_SECONDS = 5 * 60;

function token() {
  return randomBytes(32).toString("base64url");
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function registerMcpClient(raw: unknown) {
  const parsed = clientRegistrationSchema.safeParse(raw);
  if (!parsed.success) {
    throw new OAuthError(
      "invalid_client_metadata",
      "The client metadata is invalid.",
    );
  }
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [recent] = await getDb()
    .select({ value: count() })
    .from(mcpOAuthClients)
    .where(gte(mcpOAuthClients.createdAt, oneHourAgo));
  if ((recent?.value ?? 0) >= 100) {
    throw new OAuthError(
      "temporarily_unavailable",
      "Client registration is temporarily limited.",
      429,
    );
  }

  const clientId = `bippy_${token()}`;
  await getDb()
    .insert(mcpOAuthClients)
    .values({
      clientId,
      clientName: parsed.data.client_name,
      redirectUris: [...new Set(parsed.data.redirect_uris)],
    });
  return {
    ...parsed.data,
    client_id: clientId,
    client_id_issued_at: Math.floor(Date.now() / 1000),
  };
}

export async function validateAuthorizationRequest(raw: unknown) {
  const input = authorizationRequestSchema.parse(raw);
  const config = getMcpConfig();
  if (new URL(input.resource).toString() !== config.resource) {
    throw new OAuthError(
      "invalid_target",
      "The requested resource is not Bippy MCP.",
    );
  }
  const [client] = await getDb()
    .select()
    .from(mcpOAuthClients)
    .where(eq(mcpOAuthClients.clientId, input.client_id))
    .limit(1);
  if (!client || !client.redirectUris.includes(input.redirect_uri)) {
    throw new OAuthError(
      "invalid_request",
      "The OAuth client or redirect URI is invalid.",
    );
  }
  return { input, client, scopes: parseMcpScopes(input.scope) };
}

async function ensureAuditThread(client: typeof mcpOAuthClients.$inferSelect) {
  if (client.threadId) return client.threadId;
  const [thread] = await getDb()
    .insert(agentThreads)
    .values({
      title: `${client.clientName} · Bippy MCP`,
      provider: "openai",
      model: getServerEnv().OPENAI_DEFAULT_MODEL,
    })
    .returning({ id: agentThreads.id });
  await getDb()
    .update(mcpOAuthClients)
    .set({ threadId: thread.id })
    .where(
      and(
        eq(mcpOAuthClients.clientId, client.clientId),
        isNull(mcpOAuthClients.threadId),
      ),
    );
  const [current] = await getDb()
    .select({ threadId: mcpOAuthClients.threadId })
    .from(mcpOAuthClients)
    .where(eq(mcpOAuthClients.clientId, client.clientId));
  return current?.threadId ?? thread.id;
}

export async function issueAuthorizationCode(input: {
  request: z.infer<typeof authorizationRequestSchema>;
  userId: string;
}) {
  const validated = await validateAuthorizationRequest(input.request);
  await ensureAuditThread(validated.client);
  const rawCode = token();
  await getDb()
    .insert(mcpOAuthCodes)
    .values({
      codeHash: hash(rawCode),
      clientId: validated.client.clientId,
      userId: input.userId,
      ownerGithubUserId: getServerEnv().ADMIN_GITHUB_USER_ID,
      redirectUri: validated.input.redirect_uri,
      codeChallenge: validated.input.code_challenge,
      resource: new URL(validated.input.resource).toString(),
      scopes: validated.scopes,
      expiresAt: new Date(Date.now() + CODE_SECONDS * 1000),
    });
  return rawCode;
}

async function createTokenSet(input: {
  clientId: string;
  userId: string;
  ownerGithubUserId: string;
  resource: string;
  scopes: string[];
}) {
  const accessToken = token();
  const refreshToken = token();
  const now = Date.now();
  await getDb()
    .insert(mcpOAuthTokens)
    .values({
      accessTokenHash: hash(accessToken),
      refreshTokenHash: hash(refreshToken),
      clientId: input.clientId,
      userId: input.userId,
      ownerGithubUserId: input.ownerGithubUserId,
      resource: input.resource,
      scopes: input.scopes,
      accessExpiresAt: new Date(now + ACCESS_TOKEN_SECONDS * 1000),
      refreshExpiresAt: new Date(now + REFRESH_TOKEN_SECONDS * 1000),
    });
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: "Bearer" as const,
    expires_in: ACCESS_TOKEN_SECONDS,
    scope: input.scopes.join(" "),
  };
}

export async function exchangeAuthorizationCode(input: {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier: string;
  resource: string;
}) {
  const [code] = await getDb()
    .select()
    .from(mcpOAuthCodes)
    .where(
      and(
        eq(mcpOAuthCodes.codeHash, hash(input.code)),
        isNull(mcpOAuthCodes.usedAt),
        gt(mcpOAuthCodes.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (
    !code ||
    code.clientId !== input.clientId ||
    code.redirectUri !== input.redirectUri ||
    code.resource !== new URL(input.resource).toString() ||
    !verifyMcpPkce(input.codeVerifier, code.codeChallenge)
  ) {
    throw new OAuthError(
      "invalid_grant",
      "The authorization code is invalid or expired.",
    );
  }
  const [claimed] = await getDb()
    .update(mcpOAuthCodes)
    .set({ usedAt: new Date() })
    .where(and(eq(mcpOAuthCodes.id, code.id), isNull(mcpOAuthCodes.usedAt)))
    .returning({ id: mcpOAuthCodes.id });
  if (!claimed)
    throw new OAuthError(
      "invalid_grant",
      "The authorization code was already used.",
    );
  return createTokenSet(code);
}

export async function refreshMcpToken(input: {
  refreshToken: string;
  clientId: string;
  resource: string;
}) {
  const [existing] = await getDb()
    .select()
    .from(mcpOAuthTokens)
    .where(
      and(
        eq(mcpOAuthTokens.refreshTokenHash, hash(input.refreshToken)),
        isNull(mcpOAuthTokens.revokedAt),
        gt(mcpOAuthTokens.refreshExpiresAt, new Date()),
      ),
    )
    .limit(1);
  if (
    !existing ||
    existing.clientId !== input.clientId ||
    existing.resource !== new URL(input.resource).toString()
  ) {
    throw new OAuthError(
      "invalid_grant",
      "The refresh token is invalid or expired.",
    );
  }
  const [revoked] = await getDb()
    .update(mcpOAuthTokens)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(
      and(eq(mcpOAuthTokens.id, existing.id), isNull(mcpOAuthTokens.revokedAt)),
    )
    .returning({ id: mcpOAuthTokens.id });
  if (!revoked)
    throw new OAuthError(
      "invalid_grant",
      "The refresh token was already used.",
    );
  return createTokenSet(existing);
}

export async function verifyMcpAccessToken(rawToken: string) {
  const [row] = await getDb()
    .select()
    .from(mcpOAuthTokens)
    .where(
      and(
        eq(mcpOAuthTokens.accessTokenHash, hash(rawToken)),
        isNull(mcpOAuthTokens.revokedAt),
        gt(mcpOAuthTokens.accessExpiresAt, new Date()),
      ),
    )
    .limit(1);
  const config = getMcpConfig();
  if (
    !row ||
    row.resource !== config.resource ||
    row.ownerGithubUserId !== getServerEnv().ADMIN_GITHUB_USER_ID
  ) {
    return null;
  }
  const [client] = await getDb()
    .select()
    .from(mcpOAuthClients)
    .where(eq(mcpOAuthClients.clientId, row.clientId))
    .limit(1);
  if (!client?.threadId) return null;
  await touchMcpClient(client.clientId);
  return { token: row, client, rawToken };
}

export async function revokeMcpToken(rawToken: string, clientId?: string) {
  const tokenHash = hash(rawToken);
  const tokenMatch = or(
    eq(mcpOAuthTokens.accessTokenHash, tokenHash),
    eq(mcpOAuthTokens.refreshTokenHash, tokenHash),
  );
  await getDb()
    .update(mcpOAuthTokens)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(
      clientId
        ? and(eq(mcpOAuthTokens.clientId, clientId), tokenMatch)
        : tokenMatch,
    );
}
