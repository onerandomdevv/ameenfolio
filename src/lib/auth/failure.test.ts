import { describe, expect, it, vi, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

import {
  describeApiError,
  describeThrownError,
  logAuthFailure,
  missingDataFailure,
} from "@/lib/auth/failure";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("describeApiError", () => {
  it("returns null when nothing failed", () => {
    expect(describeApiError(null)).toBeNull();
    expect(describeApiError(undefined)).toBeNull();
  });

  it("treats a rejection of this caller as permanent", () => {
    // 401 answers the same way however many times it is asked, so a repeat is
    // a real defect rather than something to wait out.
    const failure = describeApiError({
      code: "UNAUTHORIZED",
      message: "Session expired",
      status: 401,
      statusText: "Unauthorized",
    });

    expect(failure).toEqual({
      kind: "permanent",
      code: "UNAUTHORIZED",
      status: 401,
      detail: "Session expired (Unauthorized)",
    });
  });

  it("treats the service's own faults and backpressure as transient", () => {
    for (const status of [408, 429, 500, 502, 503, 504]) {
      expect(describeApiError({ status, message: "x" })?.kind).toBe(
        "transient",
      );
    }
  });

  it("treats every transport code as transient regardless of status", () => {
    for (const code of [
      "NETWORK_ERROR",
      "NETWORK_DNS",
      "NETWORK_REFUSED",
      "NETWORK_TIMEOUT",
      "NETWORK_TLS",
      "NETWORK_RESET",
      "NETWORK_ABORT",
    ]) {
      expect(describeApiError({ code, status: 0 })?.kind).toBe("transient");
    }
  });

  it("survives an error carrying neither message nor code", () => {
    // The shape the SDK actually returns has both optional; logging the string
    // "undefined" as a diagnosis was the bug this module exists to end.
    const failure = describeApiError({ status: 400, statusText: "" });

    expect(failure).toEqual({
      kind: "permanent",
      code: "UNKNOWN",
      status: 400,
      detail: "No message.",
    });
  });

  it("omits the status text when it adds nothing", () => {
    expect(describeApiError({ message: "Boom", status: 400 })?.detail).toBe(
      "Boom",
    );
  });
});

describe("describeThrownError", () => {
  it("classifies a failed fetch by its nested cause, not its message", () => {
    // Stringifying this yields "TypeError: fetch failed", which names the layer
    // that broke and nothing about why. The reason lives in `cause`.
    const error = new TypeError("fetch failed", {
      cause: Object.assign(new Error("getaddrinfo ENOTFOUND"), {
        code: "ENOTFOUND",
      }),
    });

    const failure = describeThrownError(error);
    expect(failure.kind).toBe("transient");
    expect(failure.code).toMatch(/^NETWORK_/);
  });

  it("calls a programmer error permanent and keeps its text", () => {
    const failure = describeThrownError(new RangeError("Invalid time value"));

    expect(failure.kind).toBe("permanent");
    expect(failure.code).toBe("INTERNAL_ERROR");
    expect(failure.detail).toContain("Invalid time value");
  });

  it("never returns an empty detail, whatever was thrown", () => {
    for (const thrown of [undefined, null, "", 0, {}]) {
      expect(describeThrownError(thrown).detail).toBeTruthy();
    }
  });

  it("finds the reason inside an AggregateError's members", () => {
    // What a connect attempt rejects with when every resolved address failed:
    // the wrapper says nothing, each member says why.
    const error = new TypeError("fetch failed", {
      cause: new AggregateError(
        [
          Object.assign(new Error("connect ECONNREFUSED ::1:443"), {
            code: "ECONNREFUSED",
          }),
        ],
        "All connection attempts failed",
      ),
    });

    expect(describeThrownError(error)).toMatchObject({
      kind: "transient",
      code: "NETWORK_REFUSED",
    });
  });

  it("terminates on a cause chain that points at itself", () => {
    const error: Error & { cause?: unknown } = new Error("looping");
    error.cause = error;

    // The assertion is that this returns at all — an unbounded walk would hang
    // the very request the error was meant to explain.
    expect(describeThrownError(error).kind).toBe("permanent");
  });

  it("calls an unrecognised fetch rejection transient anyway", () => {
    // It still never completed, so retrying can plausibly differ — unlike an
    // error thrown by our own code, which would throw identically next time.
    expect(describeThrownError(new TypeError("fetch failed"))).toMatchObject({
      kind: "transient",
      code: "NETWORK_ERROR",
    });
  });

  it("reads a timeout from the error name when there is no code", () => {
    const error = new Error("The operation timed out");
    error.name = "TimeoutError";

    expect(describeThrownError(error).code).toBe("NETWORK_TIMEOUT");
  });
});

describe("logAuthFailure", () => {
  it("logs a transient failure as a warning and a permanent one as an error", () => {
    // The level is the signal: warnings are expected to appear occasionally,
    // so an error line is worth reading every time one shows up.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    logAuthFailure("auth.test", {
      kind: "transient",
      code: "NETWORK_TIMEOUT",
    });
    logAuthFailure("auth.test", missingDataFailure);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
    expect(JSON.parse(warn.mock.calls[0][0] as string)).toMatchObject({
      level: "warn",
      event: "auth.test",
      kind: "transient",
      code: "NETWORK_TIMEOUT",
    });
    expect(JSON.parse(error.mock.calls[0][0] as string)).toMatchObject({
      level: "error",
      kind: "permanent",
      code: "MISSING_DATA",
    });
  });

  it("carries the caller's own details through", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    logAuthFailure("auth.test", missingDataFailure, { sessionId: "abc123" });

    expect(JSON.parse(error.mock.calls[0][0] as string)).toMatchObject({
      sessionId: "abc123",
    });
  });
});
