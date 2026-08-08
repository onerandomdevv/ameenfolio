import "server-only";

import { createNeonAuth, type NeonAuth } from "@neondatabase/auth/next/server";
import { forbidden, redirect } from "next/navigation";
import { getServerEnv, requireServerEnv } from "@/lib/env";
import { logServer } from "@/lib/logger";
import { isAllowedAdminAccount, type LinkedAccount } from "@/lib/auth/guards";
import { adminHref } from "@/lib/admin-path";

let authInstance: NeonAuth | undefined;

export function getAuth() {
  if (!authInstance) {
    const { NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET } = requireServerEnv(
      "NEON_AUTH_BASE_URL",
      "NEON_AUTH_COOKIE_SECRET",
    );
    authInstance = createNeonAuth({
      baseUrl: NEON_AUTH_BASE_URL,
      cookies: { secret: NEON_AUTH_COOKIE_SECRET, sessionDataTtl: 300 },
      logger: {
        error: (message, meta) =>
          logServer("error", "auth.sdk", { message, ...meta }),
        warn: (message, meta) =>
          logServer("warn", "auth.sdk", { message, ...meta }),
      },
    });
  }
  return authInstance;
}

export async function requireAdmin() {
  const auth = getAuth();
  const { data: session, error: sessionError } = await auth.getSession();

  if (sessionError || !session?.user) {
    logServer("warn", "auth.unauthenticated", {
      reason: sessionError?.message ?? "missing_session",
    });
    redirect(await adminHref("/login"));
  }

  const { data: accounts, error: accountsError } = await auth.listAccounts();
  if (
    accountsError ||
    !accounts ||
    !isAllowedAdminAccount(
      accounts as LinkedAccount[],
      getServerEnv().ADMIN_GITHUB_USER_ID,
    )
  ) {
    logServer("warn", "auth.forbidden", {
      userId: session.user.id,
      reason: accountsError?.message ?? "github_account_mismatch",
    });
    forbidden();
  }

  return session.user;
}
