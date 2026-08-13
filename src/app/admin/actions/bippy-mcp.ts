"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth/server";
import {
  deleteBippyMcpConnection,
  beginBippyMcpOAuth,
  saveAndDiscoverBippyMcpConnection,
  updateBippyMcpToolSettings,
  type BippyMcpConnectionInput,
  type BippyMcpToolSettingsInput,
} from "@/lib/ai/bippy-mcp";
import { logServer } from "@/lib/logger";

export async function saveBippyMcpConnection(input: BippyMcpConnectionInput) {
  await requireAdmin();
  try {
    if (input.authType === "oauth") {
      const requestHeaders = await headers();
      const host =
        requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
      if (!host) throw new Error("Could not determine the admin callback URL.");
      const protocol =
        requestHeaders.get("x-forwarded-proto") ??
        (host.startsWith("localhost") ? "http" : "https");
      const callbackUrl = `${protocol}://${host}/api/admin/bippy-mcp/oauth/callback`;
      const oauth = await beginBippyMcpOAuth(input, callbackUrl);
      return {
        ok: true as const,
        connection: oauth.connection,
        authorizationUrl: oauth.authorizationUrl,
      };
    }
    return {
      ok: true as const,
      connection: await saveAndDiscoverBippyMcpConnection(input),
      authorizationUrl: undefined,
    };
  } catch (error) {
    logServer("error", "assistant.mcp_connection_save_failed", {
      error: String(error),
    });
    return {
      ok: false as const,
      message:
        error instanceof Error
          ? error.message
          : "The MCP connection could not be saved.",
    };
  }
}

export async function saveBippyMcpToolSettings(
  input: BippyMcpToolSettingsInput,
) {
  await requireAdmin();
  try {
    return {
      ok: true as const,
      connection: await updateBippyMcpToolSettings(input),
    };
  } catch (error) {
    logServer("error", "assistant.mcp_tools_save_failed", {
      error: String(error),
    });
    return {
      ok: false as const,
      message:
        error instanceof Error
          ? error.message
          : "The MCP tool settings could not be saved.",
    };
  }
}

export async function removeBippyMcpConnection(id: string) {
  await requireAdmin();
  try {
    const deleted = await deleteBippyMcpConnection(z.uuid().parse(id));
    return deleted
      ? { ok: true as const }
      : { ok: false as const, message: "MCP connection not found." };
  } catch (error) {
    logServer("error", "assistant.mcp_connection_delete_failed", {
      error: String(error),
    });
    return {
      ok: false as const,
      message: "The MCP connection could not be removed.",
    };
  }
}
