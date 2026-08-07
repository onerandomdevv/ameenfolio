/**
 * TEMPORARY DIAGNOSTIC ROUTE — remove once the /api/auth 502 is resolved.
 *
 * Disabled unless DIAG_TOKEN is set in the environment, and requires that exact
 * token as ?token=... Returns 404 otherwise so it is invisible in production.
 *
 * Reports env-var *presence* (never values) and the result of server-side
 * fetches from inside the runtime, to distinguish "cannot reach Neon Auth"
 * from "reaches it fine, so the failure is in the SDK/proxy response path".
 */
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tokenMatches(provided: string | null): boolean {
  const expected = process.env.DIAG_TOKEN;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function describeError(error: unknown) {
  if (!(error instanceof Error)) return { message: String(error) };
  const cause = error.cause as { code?: string; errno?: number } | undefined;
  return {
    name: error.name,
    message: error.message,
    causeCode: cause?.code,
    causeErrno: cause?.errno,
  };
}

async function probe(label: string, url: string) {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    return {
      label,
      url,
      reached: true,
      status: response.status,
      ms: Date.now() - started,
    };
  } catch (error) {
    return {
      label,
      url,
      reached: false,
      ms: Date.now() - started,
      error: describeError(error),
    };
  }
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!tokenMatches(token)) {
    return new Response(null, { status: 404 });
  }

  const authBaseUrl = process.env.NEON_AUTH_BASE_URL;
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

  const env = {
    NEON_AUTH_BASE_URL: Boolean(authBaseUrl),
    NEON_AUTH_COOKIE_SECRET: Boolean(cookieSecret),
    NEON_AUTH_COOKIE_SECRET_length: cookieSecret?.length ?? 0,
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    ADMIN_GITHUB_USER_ID: Boolean(process.env.ADMIN_GITHUB_USER_ID),
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? null,
    CANONICAL_SITE_URL: process.env.CANONICAL_SITE_URL ?? null,
  };

  let authHost: string | null = null;
  let authPath: string | null = null;
  let parseError: string | null = null;
  if (authBaseUrl) {
    try {
      const parsed = new URL(authBaseUrl);
      authHost = parsed.host;
      authPath = parsed.pathname;
    } catch {
      parseError = "NEON_AUTH_BASE_URL is not a valid URL";
    }
  }

  const probes = [];
  if (authBaseUrl && !parseError) {
    probes.push(
      await probe("neon-auth-base", authBaseUrl),
      await probe(
        "neon-auth-session",
        `${authBaseUrl.replace(/\/$/, "")}/session`,
      ),
    );
  }
  // Control: proves whether outbound egress works at all from this runtime.
  probes.push(await probe("control-egress", "https://neon.tech/robots.txt"));

  return Response.json(
    {
      checkedAt: new Date().toISOString(),
      nodeVersion: process.version,
      env,
      authHost,
      authPath,
      parseError,
      probes,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
