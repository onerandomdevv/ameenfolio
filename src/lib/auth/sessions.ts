import "server-only";

import { getAuth, requireAdmin } from "@/lib/auth/server";
import {
  describeApiError,
  describeThrownError,
  logAuthFailure,
  missingDataFailure,
  type AuthFailure,
} from "@/lib/auth/failure";
import {
  describeSessionDevice,
  maskSessionIp,
  type SessionDeviceKind,
} from "@/lib/auth/session-display";

export type AdminSessionView = {
  id: string;
  current: boolean;
  deviceLabel: string;
  deviceKind: SessionDeviceKind;
  maskedIp: string | null;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
};

export type AdminSessionsResult = {
  sessions: AdminSessionView[];
  error: string | null;
};

// Says which of the two it was, because the difference decides what the reader
// should do: wait and retry, or go looking. The cause itself stays in the log —
// a status code in front of an admin is noise.
//
// The transient wording avoids claiming the service did not respond: a 429 or
// a 500 is transient and did respond, so naming the cause would be wrong for
// half the cases it covers.
function bannerFor(failure: AuthFailure) {
  return failure.kind === "transient"
    ? "Active sessions could not be loaded — the auth service is temporarily unavailable. Refreshing usually clears it."
    : "Active sessions could not be loaded. Try refreshing the page.";
}

function iso(value: Date | string) {
  return new Date(
    value instanceof Date ? value.getTime() : value,
  ).toISOString();
}

export async function getAdminSessions(): Promise<AdminSessionsResult> {
  await requireAdmin();

  try {
    const auth = getAuth();
    const [currentResult, sessionsResult] = await Promise.all([
      auth.getSession(),
      auth.listSessions(),
    ]);

    // Whichever call actually carries a reason wins; a result that merely came
    // back empty falls through to the placeholder so the log never records two
    // undefined messages and calls that a diagnosis.
    const currentFailure = describeApiError(currentResult.error);
    const sessionsFailure = describeApiError(sessionsResult.error);
    const apiFailure = currentFailure ?? sessionsFailure;

    if (apiFailure || !currentResult.data || !sessionsResult.data) {
      // Derived from what actually went wrong rather than from whichever
      // branch was checked first: when neither call reported an error and the
      // data is simply absent, naming one of them would be a guess printed as
      // a fact — the exact failure this logging was written to stop.
      const failedCall =
        currentFailure || !currentResult.data
          ? sessionsFailure || !sessionsResult.data
            ? "both"
            : "getSession"
          : "listSessions";

      logAuthFailure(
        "auth.sessions_list_failed",
        apiFailure ?? missingDataFailure,
        {
          failedCall,
        },
      );
      return {
        sessions: [],
        error: bannerFor(apiFailure ?? missingDataFailure),
      };
    }

    const currentSessionId = currentResult.data.session.id;
    const sessions = sessionsResult.data
      .map((session): AdminSessionView => {
        const device = describeSessionDevice(session.userAgent);
        return {
          id: session.id,
          current: session.id === currentSessionId,
          deviceLabel: device.label,
          deviceKind: device.kind,
          maskedIp: maskSessionIp(session.ipAddress),
          createdAt: iso(session.createdAt),
          lastActiveAt: iso(session.updatedAt),
          expiresAt: iso(session.expiresAt),
        };
      })
      .sort((left, right) => {
        if (left.current !== right.current) return left.current ? -1 : 1;
        return right.lastActiveAt.localeCompare(left.lastActiveAt);
      });

    return { sessions, error: null };
  } catch (error) {
    const failure = describeThrownError(error);
    logAuthFailure("auth.sessions_list_failed", failure);
    return { sessions: [], error: bannerFor(failure) };
  }
}
