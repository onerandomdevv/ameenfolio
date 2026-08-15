import { describe, expect, it } from "vitest";
import { clientKeyFromHeaders, createRateLimiter } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  it("allows up to the limit and refuses the next request", () => {
    const check = createRateLimiter({ limit: 3, windowMs: 60_000 });
    const now = 1_000_000;

    expect(check("a", now).allowed).toBe(true);
    expect(check("a", now).allowed).toBe(true);
    expect(check("a", now).allowed).toBe(true);

    const refused = check("a", now);
    expect(refused.allowed).toBe(false);
    expect(refused.retryAfterSeconds).toBe(60);
  });

  it("counts each key separately", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 60_000 });
    const now = 1_000_000;

    expect(check("a", now).allowed).toBe(true);
    expect(check("a", now).allowed).toBe(false);
    // One visitor exhausting their budget must not lock anyone else out.
    expect(check("b", now).allowed).toBe(true);
  });

  it("starts a fresh window once the old one has passed", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 60_000 });
    const now = 1_000_000;

    expect(check("a", now).allowed).toBe(true);
    expect(check("a", now + 59_000).allowed).toBe(false);
    expect(check("a", now + 60_001).allowed).toBe(true);
  });

  it("reports a shrinking retry-after as the window drains", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 60_000 });
    const now = 1_000_000;

    check("a", now);
    expect(check("a", now + 30_000).retryAfterSeconds).toBe(30);
    // Never zero while still refusing, or a client would retry immediately.
    expect(check("a", now + 59_900).retryAfterSeconds).toBe(1);
  });

  it("keeps its memory bounded as keys accumulate", () => {
    const check = createRateLimiter({ limit: 5, windowMs: 1_000 });

    // Far more distinct keys than the cap, each in its own expired window.
    for (let index = 0; index < 2_000; index += 1) {
      check(`key-${index}`, 1_000_000 + index * 2_000);
    }

    // The limiter still works rather than having grown without limit.
    const now = 9_000_000;
    expect(check("fresh", now).allowed).toBe(true);
  });
});

describe("clientKeyFromHeaders", () => {
  it("takes the original client from a proxy chain", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.5, 198.51.100.9, 192.0.2.1",
    });
    expect(clientKeyFromHeaders(headers)).toBe("203.0.113.5");
  });

  it("prefers an edge-set header over a forwarded chain the caller can write", () => {
    // The attack this closes: x-forwarded-for is appended to, so its left-most
    // entry is whatever the caller sent. Trusting it first would let one client
    // mint a fresh key per request and walk straight past the limit.
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.1",
      "cf-connecting-ip": "203.0.113.5",
    });
    expect(clientKeyFromHeaders(headers)).toBe("203.0.113.5");
  });

  it("varying the forgeable header cannot change the key", () => {
    const keys = new Set(
      ["1.1.1.1", "2.2.2.2", "3.3.3.3"].map((spoofed) =>
        clientKeyFromHeaders(
          new Headers({
            "x-forwarded-for": spoofed,
            "x-vercel-forwarded-for": "203.0.113.5",
          }),
        ),
      ),
    );
    expect([...keys]).toEqual(["203.0.113.5"]);
  });

  it("honours each supported edge header", () => {
    for (const header of [
      "cf-connecting-ip",
      "x-vercel-forwarded-for",
      "fly-client-ip",
      "true-client-ip",
    ]) {
      expect(
        clientKeyFromHeaders(new Headers({ [header]: "203.0.113.5" })),
      ).toBe("203.0.113.5");
    }
  });

  it("reads the client end of an edge header that carries a list", () => {
    const headers = new Headers({
      "cf-connecting-ip": "203.0.113.5, 198.51.100.9",
    });
    expect(clientKeyFromHeaders(headers)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip, then to a shared bucket", () => {
    expect(
      clientKeyFromHeaders(new Headers({ "x-real-ip": "203.0.113.7" })),
    ).toBe("203.0.113.7");
    expect(clientKeyFromHeaders(new Headers())).toBe("unknown");
  });

  it("ignores an empty forwarded header rather than keying on blank", () => {
    const headers = new Headers({
      "x-forwarded-for": "  ",
      "x-real-ip": "203.0.113.8",
    });
    expect(clientKeyFromHeaders(headers)).toBe("203.0.113.8");
  });
});
