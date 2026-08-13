"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/server";
import {
  cleanupExpiredMcpCredentials,
  disconnectMcpClient,
} from "@/lib/mcp/connections";
import {
  authorizationRequestSchema,
  issueAuthorizationCode,
} from "@/lib/mcp/oauth";

function refreshConnections() {
  revalidatePath("/admin/mcp");
  revalidatePath("/mcp");
}

export async function disconnectMcpConnection(clientId: string) {
  await requireAdmin();
  const disconnected = await disconnectMcpClient(clientId);
  refreshConnections();
  return {
    ok: true as const,
    message: disconnected
      ? "Connection revoked."
      : "This connection was already inactive.",
  };
}

export async function cleanMcpCredentials() {
  await requireAdmin();
  const removed = await cleanupExpiredMcpCredentials();
  refreshConnections();
  return { ok: true as const, removed };
}

export async function decideMcpAuthorization(formData: FormData) {
  const user = await requireAdmin();
  const request = authorizationRequestSchema.parse({
    response_type: formData.get("response_type"),
    client_id: formData.get("client_id"),
    redirect_uri: formData.get("redirect_uri"),
    code_challenge: formData.get("code_challenge"),
    code_challenge_method: formData.get("code_challenge_method"),
    state: formData.get("state"),
    resource: formData.get("resource"),
    scope: formData.get("scope"),
  });
  const callback = new URL(request.redirect_uri);
  callback.searchParams.set("state", request.state);

  if (formData.get("decision") !== "approve") {
    callback.searchParams.set("error", "access_denied");
    callback.searchParams.set(
      "error_description",
      "The owner declined the Bippy MCP connection.",
    );
    redirect(callback.toString());
  }

  const code = await issueAuthorizationCode({ request, userId: user.id });
  callback.searchParams.set("code", code);
  redirect(callback.toString());
}
