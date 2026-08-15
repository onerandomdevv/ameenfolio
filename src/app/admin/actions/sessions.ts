"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuth, requireAdmin } from "@/lib/auth/server";
import { logServer } from "@/lib/logger";

const sessionIdSchema = z.string().min(1).max(128);

function refreshSessionSettings() {
  revalidatePath("/admin/settings");
  revalidatePath("/settings");
}

export async function revokeAdminSession(sessionId: string) {
  await requireAdmin();
  const parsed = sessionIdSchema.safeParse(sessionId);
  if (!parsed.success) {
    return { ok: false as const, message: "The session is invalid." };
  }

  try {
    const auth = getAuth();
    const [currentResult, sessionsResult] = await Promise.all([
      auth.getSession(),
      auth.listSessions(),
    ]);

    if (
      currentResult.error ||
      !currentResult.data ||
      sessionsResult.error ||
      !sessionsResult.data
    ) {
      logServer("error", "auth.session_revoke_lookup_failed", {
        sessionId: parsed.data,
        currentSessionError: currentResult.error?.message,
        sessionsError: sessionsResult.error?.message,
      });
      return {
        ok: false as const,
        message: "The session could not be verified.",
      };
    }

    const session = sessionsResult.data.find((item) => item.id === parsed.data);
    if (!session) {
      refreshSessionSettings();
      return {
        ok: true as const,
        message: "That session was already signed out.",
      };
    }

    if (session.id === currentResult.data.session.id) {
      return {
        ok: false as const,
        message: "Use the account menu to sign out this device.",
      };
    }

    const result = await auth.revokeSession({ token: session.token });
    if (result.error || !result.data?.status) {
      logServer("error", "auth.session_revoke_failed", {
        sessionId: parsed.data,
        error: result.error?.message,
      });
      return {
        ok: false as const,
        message: "The session could not be signed out.",
      };
    }

    logServer("info", "auth.session_revoked", { sessionId: parsed.data });
    refreshSessionSettings();
    return { ok: true as const, message: "Device signed out." };
  } catch (error) {
    logServer("error", "auth.session_revoke_failed", {
      sessionId: parsed.data,
      error: String(error),
    });
    return {
      ok: false as const,
      message: "The session could not be signed out.",
    };
  }
}

export async function revokeOtherAdminSessions() {
  await requireAdmin();
  const auth = getAuth();

  try {
    const [currentResult, sessionsResult] = await Promise.all([
      auth.getSession(),
      auth.listSessions(),
    ]);
    if (
      currentResult.error ||
      !currentResult.data ||
      sessionsResult.error ||
      !sessionsResult.data
    ) {
      logServer("error", "auth.other_sessions_revoke_lookup_failed", {
        currentSessionError: currentResult.error?.message,
        sessionsError: sessionsResult.error?.message,
      });
      return {
        ok: false as const,
        message: "Other devices could not be verified.",
      };
    }

    const currentSessionId = currentResult.data.session.id;
    const otherSessions = sessionsResult.data.filter(
      (session) => session.id !== currentSessionId,
    );
    const results = await Promise.all(
      otherSessions.map((session) =>
        auth.revokeSession({ token: session.token }),
      ),
    );
    const failed = results.find(
      (result) => result.error || !result.data?.status,
    );
    if (failed) {
      logServer("error", "auth.other_sessions_revoke_failed", {
        error: failed.error?.message,
        attempted: otherSessions.length,
      });
      return {
        ok: false as const,
        message: "One or more devices could not be signed out.",
      };
    }

    logServer("info", "auth.other_sessions_revoked", {
      count: otherSessions.length,
    });
    refreshSessionSettings();
    return {
      ok: true as const,
      message: otherSessions.length
        ? "All other devices were signed out."
        : "No other devices are signed in.",
    };
  } catch (error) {
    logServer("error", "auth.other_sessions_revoke_failed", {
      error: String(error),
    });
    return {
      ok: false as const,
      message: "Other devices could not be signed out.",
    };
  }
}
