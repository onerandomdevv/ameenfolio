import "server-only";

import { getAuth, requireAdmin } from "@/lib/auth/server";
import {
  describeSessionDevice,
  maskSessionIp,
  type SessionDeviceKind,
} from "@/lib/auth/session-display";
import { logServer } from "@/lib/logger";

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

    if (
      currentResult.error ||
      !currentResult.data ||
      sessionsResult.error ||
      !sessionsResult.data
    ) {
      logServer("error", "auth.sessions_list_failed", {
        currentSessionError: currentResult.error?.message,
        sessionsError: sessionsResult.error?.message,
      });
      return {
        sessions: [],
        error: "Active sessions could not be loaded. Try refreshing the page.",
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
    logServer("error", "auth.sessions_list_failed", { error: String(error) });
    return {
      sessions: [],
      error: "Active sessions could not be loaded. Try refreshing the page.",
    };
  }
}
