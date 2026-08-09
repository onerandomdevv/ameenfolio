import { describe, expect, it } from "vitest";
import { serverEnvSchema } from "@/lib/env";

const base = {};

describe("server environment", () => {
  it("accepts an environment with nothing set", () => {
    expect(() => serverEnvSchema.parse(base)).not.toThrow();
  });

  // Every one of these is expressed as `KEY=` by a shell, a CI workflow or a
  // fresh .env, and getServerEnv() is reached from page render — so treating a
  // blank optional as invalid is a site-wide outage, not a config warning.
  it.each([
    "NEON_AUTH_BASE_URL",
    "NEON_AUTH_COOKIE_SECRET",
    "DATABASE_URL",
    "R2_ACCOUNT_ID",
    "R2_PUBLIC_BASE_URL",
    "GITHUB_STATS_USERNAME",
    "GITHUB_STATS_TOKEN",
    "WAKATIME_API_KEY",
  ])("treats a blank %s as absent rather than invalid", (key) => {
    const parsed = serverEnvSchema.parse({ ...base, [key]: "" });

    expect(parsed[key as keyof typeof parsed]).toBeUndefined();
  });

  it("survives every optional key being blank at once", () => {
    expect(() =>
      serverEnvSchema.parse({
        NEON_AUTH_BASE_URL: "",
        NEON_AUTH_COOKIE_SECRET: "",
        DATABASE_URL: "",
        R2_ACCOUNT_ID: "",
        R2_ACCESS_KEY_ID: "",
        R2_SECRET_ACCESS_KEY: "",
        R2_BUCKET_NAME: "",
        R2_PUBLIC_BASE_URL: "",
        GITHUB_STATS_USERNAME: "",
        GITHUB_STATS_TOKEN: "",
        WAKATIME_API_KEY: "",
      }),
    ).not.toThrow();
  });

  it("falls back to defaults when a defaulted key is blank", () => {
    const parsed = serverEnvSchema.parse({
      ...base,
      ADMIN_GITHUB_USER_ID: "",
      NEXT_PUBLIC_APP_URL: "",
    });

    expect(parsed.ADMIN_GITHUB_USER_ID).toBe("231661599");
    expect(parsed.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });

  it("still rejects a value that is present but malformed", () => {
    expect(() =>
      serverEnvSchema.parse({ ...base, NEON_AUTH_BASE_URL: "not-a-url" }),
    ).toThrow();
  });

  it("keeps real credentials intact", () => {
    const parsed = serverEnvSchema.parse({
      ...base,
      GITHUB_STATS_USERNAME: "onerandomdevv",
      GITHUB_STATS_TOKEN: "ghp_example",
      WAKATIME_API_KEY: "waka_example",
    });

    expect(parsed.GITHUB_STATS_USERNAME).toBe("onerandomdevv");
    expect(parsed.GITHUB_STATS_TOKEN).toBe("ghp_example");
    expect(parsed.WAKATIME_API_KEY).toBe("waka_example");
  });
});
