import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";
import { createNeonAuth, type NeonAuth } from "@neondatabase/auth/next/server";
import { forbidden, redirect } from "next/navigation";
import { getServerEnv, requireServerEnv } from "@/lib/env";
import { logServer } from "@/lib/logger";
import { isAllowedAdminAccount, type LinkedAccount } from "@/lib/auth/guards";
import { adminHref } from "@/lib/admin-path";

let authInstance: NeonAuth | undefined;
const trustedMcpMutation = new AsyncLocalStorage<boolean>();

export function runAsMcpMutation<T>(operation: () => Promise<T>) {
  return trustedMcpMutation.run(true, operation);
}

export function getAuth() {
  if (!authInstance) {
    const { NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET } = requireServerEnv(
      "NEON_AUTH_BASE_URL",
      "NEON_AUTH_COOKIE_SECRET",
    );
    authInstance = createNeonAuth({
      baseUrl: NEON_AUTH_BASE_URL,
      cookies: {
        secret: NEON_AUTH_COOKIE_SECRET,
        sessionDataTtl: 300,
        // The SDK defaults to "strict", which withholds the session cookie on
        // top-level cross-site navigations — and returning from GitHub's OAuth
        // consent screen is exactly that. The redirect back then arrives with
        // no session and bounces straight to the login page, having signed in
        // successfully a moment earlier.
        //
        // Browsers disagree about how strictly to apply this to the final hop
        // of a redirect chain, which is why desktop got away with it and
        // mobile did not. "lax" is what the SDK itself hard-coded before this
        // option existed: sent on top-level GET navigations, withheld on
        // cross-site subrequests, so the CSRF protection that matters stays.
        sameSite: "lax",
      },
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

export async function getAuthorizedAdmin() {
  const auth = getAuth();
  const { data: session, error: sessionError } = await auth.getSession();
  if (sessionError || !session?.user) return null;

  const { data: accounts, error: accountsError } = await auth.listAccounts();
  if (
    accountsError ||
    !accounts ||
    !isAllowedAdminAccount(
      accounts as LinkedAccount[],
      getServerEnv().ADMIN_GITHUB_USER_ID,
    )
  ) {
    return null;
  }
  return session.user;
}

export async function requireAdmin() {
  if (trustedMcpMutation.getStore()) {
    return { id: "mcp-approval" } as unknown as NonNullable<
      Awaited<ReturnType<typeof getAuthorizedAdmin>>
    >;
  }
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
