/**
 * Turns an auth failure into something a log line can answer questions with.
 *
 * The admin session panel showed one generic banner for every way it could
 * fail, and the log behind it recorded only `error.message`. When it did fail
 * there was nothing to tell a momentary network fault apart from a real
 * rejection — the panel recovered on its own and the cause was unrecoverable
 * after the fact. The point of this module is that the next occurrence is
 * legible from the log alone.
 *
 * The Neon Auth SDK ships an equivalent classifier, but importing it drags in
 * `next/headers` and with it the whole request context, which makes this
 * untestable. The rules below are small enough to own outright, and owning
 * them keeps a beta SDK's internals out of our diagnostics.
 */
import "server-only";

import { logServer } from "@/lib/logger";

/**
 * The error the SDK's result objects actually carry, which is looser than the
 * `NeonAuthServerApiError` it exports: on these endpoints `message` and `code`
 * are both optional. Describing the real shape keeps the optionality visible
 * here, where it is handled, instead of asserting it away at the call site.
 */
export type AuthApiErrorLike = {
  code?: string;
  message?: string;
  status?: number;
  statusText?: string;
};

export type AuthFailureKind = "transient" | "permanent";

export type AuthFailure = {
  /**
   * `transient` means retrying could plausibly succeed — the request never
   * reached the auth service, or it answered with something that is about
   * load rather than about this caller. `permanent` means the answer would
   * be the same next time, so a recurrence is a real defect.
   */
  kind: AuthFailureKind;
  code: string;
  status?: number;
  detail?: string;
};

// 408 and 429 are the server saying "not now" rather than "not you", and any
// 5xx is its own fault, not the request's. Everything else — 401, 403, 404,
// a malformed request — would answer identically on a retry.
function statusIsTransient(status: number | undefined) {
  if (status === undefined) return false;
  return status === 408 || status === 429 || status >= 500;
}

/**
 * Describes an error returned in an SDK result (`{ data, error }`), not thrown.
 *
 * Returns null for a result that did not fail, so a caller can pass both of
 * its results in and keep whichever actually carries a reason.
 */
export function describeApiError(
  error: AuthApiErrorLike | null | undefined,
): AuthFailure | null {
  if (!error) return null;

  const code = error.code || "UNKNOWN";
  const message = error.message || "No message.";
  return {
    // Matched by prefix rather than against a fixed list: the SDK's transport
    // codes are all NETWORK_*, and a new one added upstream should classify
    // correctly here without this file having to hear about it.
    kind:
      code.startsWith("NETWORK_") || statusIsTransient(error.status)
        ? "transient"
        : "permanent",
    code,
    status: error.status,
    // statusText is frequently empty over HTTP/2, so it is only worth adding
    // when it says something the status number does not.
    detail: error.statusText ? `${message} (${error.statusText})` : message,
  };
}

// The reasons a request never got an answer. Node's own socket errors plus
// undici's, which is what `fetch` rejects with on this runtime.
const transportCodes = new Map<string, string>([
  ["ENOTFOUND", "NETWORK_DNS"],
  ["EAI_AGAIN", "NETWORK_DNS"],
  ["ECONNREFUSED", "NETWORK_REFUSED"],
  ["ECONNRESET", "NETWORK_RESET"],
  ["EPIPE", "NETWORK_RESET"],
  ["ECONNABORTED", "NETWORK_ABORT"],
  ["ETIMEDOUT", "NETWORK_TIMEOUT"],
  ["EHOSTUNREACH", "NETWORK_ERROR"],
  ["ENETUNREACH", "NETWORK_ERROR"],
  ["UND_ERR_CONNECT_TIMEOUT", "NETWORK_TIMEOUT"],
  ["UND_ERR_HEADERS_TIMEOUT", "NETWORK_TIMEOUT"],
  ["UND_ERR_BODY_TIMEOUT", "NETWORK_TIMEOUT"],
  ["UND_ERR_SOCKET", "NETWORK_RESET"],
]);

// Depth-bounded because a cause chain is not guaranteed acyclic — an error
// whose cause is itself would otherwise hang the request it was meant to
// explain.
const MAX_CAUSE_DEPTH = 8;

function findTransportCode(error: unknown, depth = 0): string | null {
  if (!error || typeof error !== "object" || depth >= MAX_CAUSE_DEPTH) {
    return null;
  }

  const candidate = error as {
    code?: unknown;
    name?: unknown;
    message?: unknown;
    cause?: unknown;
    errors?: unknown;
  };

  if (typeof candidate.code === "string") {
    const mapped = transportCodes.get(candidate.code);
    if (mapped) return mapped;
  }
  if (candidate.name === "TimeoutError") return "NETWORK_TIMEOUT";
  if (candidate.name === "AbortError") return "NETWORK_ABORT";

  // AggregateError, which is what a multi-address connect attempt rejects with
  // when every address failed. The reason is in the members, not the wrapper.
  if (Array.isArray(candidate.errors)) {
    for (const member of candidate.errors) {
      const found = findTransportCode(member, depth + 1);
      if (found) return found;
    }
  }

  return findTransportCode(candidate.cause, depth + 1);
}

/**
 * Describes a thrown error — the `catch` case, where a fetch rejected and the
 * real reason is nested in `cause` rather than in `message`. Stringifying such
 * an error yields "TypeError: fetch failed", which names the layer that broke
 * and nothing about why.
 */
export function describeThrownError(error: unknown): AuthFailure {
  const transportCode = findTransportCode(error);
  if (transportCode) {
    return { kind: "transient", code: transportCode, detail: detailOf(error) };
  }

  // A rejected fetch whose cause says nothing recognisable is still a fetch
  // that never completed, so it is transient even unclassified. Anything else
  // reaching this point threw inside our own code and will throw again.
  if (error instanceof TypeError && /fetch failed/i.test(error.message)) {
    return {
      kind: "transient",
      code: "NETWORK_ERROR",
      detail: detailOf(error),
    };
  }

  return {
    kind: "permanent",
    code: "INTERNAL_ERROR",
    detail: detailOf(error),
  };
}

// Never empty: an error logged without a description is the problem this
// module was written to remove, and `String()` alone yields "[object Object]"
// for a plain rejected value.
function detailOf(error: unknown): string {
  if (error instanceof Error) {
    const cause = error.cause;
    const causeText =
      cause instanceof Error
        ? ` <- ${cause.name}: ${cause.message}`
        : cause
          ? ` <- ${String(cause)}`
          : "";
    return `${error.name}: ${error.message}${causeText}`;
  }

  if (error && typeof error === "object") {
    try {
      return JSON.stringify(error);
    } catch {
      return "Unserialisable error object.";
    }
  }

  const text = String(error);
  return text.length > 0 ? text : `Thrown ${typeof error} with no message.`;
}

/**
 * The reason a result was rejected when neither call reported an error but the
 * data is missing anyway. Logging the two undefined messages this used to
 * produce said only that something was wrong.
 */
export const missingDataFailure: AuthFailure = {
  kind: "permanent",
  code: "MISSING_DATA",
  detail: "The auth service returned no data and no error.",
};

/**
 * Logs at a level that matches what the failure means, which is the part that
 * makes a recurrence visible: a transient blip is a warning and is expected to
 * appear occasionally, so an `error` line here is worth reading every time.
 */
export function logAuthFailure(
  event: string,
  failure: AuthFailure,
  details: Record<string, unknown> = {},
) {
  logServer(failure.kind === "transient" ? "warn" : "error", event, {
    kind: failure.kind,
    code: failure.code,
    status: failure.status,
    detail: failure.detail,
    ...details,
  });
}
