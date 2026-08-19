"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuth, requireAdmin } from "@/lib/auth/server";
import {
  describeApiError,
  describeThrownError,
  logAuthFailure,
  missingDataFailure,
} from "@/lib/auth/failure";
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

    const lookupFailure =
      describeApiError(currentResult.error) ??
      describeApiError(sessionsResult.error);

    if (lookupFailure || !currentResult.data || !sessionsResult.data) {
      logAuthFailure(
        "auth.session_revoke_lookup_failed",
        lookupFailure ?? missingDataFailure,
        { sessionId: parsed.data },
      );
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
      logAuthFailure(
        "auth.session_revoke_failed",
        describeApiError(result.error) ?? missingDataFailure,
        { sessionId: parsed.data },
      );
      return {
        ok: false as const,
        message: "The session could not be signed out.",
      };
    }

    logServer("info", "auth.session_revoked", { sessionId: parsed.data });
    refreshSessionSettings();
    return { ok: true as const, message: "Device signed out." };
  } catch (error) {
    logAuthFailure("auth.session_revoke_failed", describeThrownError(error), {
      sessionId: parsed.data,
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
    const lookupFailure =
      describeApiError(currentResult.error) ??
      describeApiError(sessionsResult.error);

    if (lookupFailure || !currentResult.data || !sessionsResult.data) {
      logAuthFailure(
        "auth.other_sessions_revoke_lookup_failed",
        lookupFailure ?? missingDataFailure,
      );
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
      logAuthFailure(
        "auth.other_sessions_revoke_failed",
        describeApiError(failed.error) ?? missingDataFailure,
        { attempted: otherSessions.length },
      );
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
    logAuthFailure(
      "auth.other_sessions_revoke_failed",
      describeThrownError(error),
    );
    return {
      ok: false as const,
      message: "Other devices could not be signed out.",
    };
  }
}
