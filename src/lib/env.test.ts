import { describe, expect, it } from "vitest";
import { serverEnvSchema } from "@/lib/env";

const base = {};

describe("server environment", () => {
  // A declared-but-blank key is the normal state of a fresh .env, and every
  // page calls getServerEnv() — so a throw here is a site-wide outage over an
  // optional credential.
  it("treats blank optional GitHub credentials as absent", () => {
    const parsed = serverEnvSchema.parse({
      ...base,
      GITHUB_STATS_USERNAME: "",
      GITHUB_STATS_TOKEN: "",
    });

    expect(parsed.GITHUB_STATS_TOKEN).toBe("");
    expect(parsed.GITHUB_STATS_USERNAME).toBe("");
  });

  it("accepts the credentials being missing entirely", () => {
    expect(() => serverEnvSchema.parse(base)).not.toThrow();
  });

  it("keeps real credentials intact", () => {
    const parsed = serverEnvSchema.parse({
      ...base,
      GITHUB_STATS_USERNAME: "onerandomdevv",
      GITHUB_STATS_TOKEN: "ghp_example",
    });

    expect(parsed.GITHUB_STATS_USERNAME).toBe("onerandomdevv");
    expect(parsed.GITHUB_STATS_TOKEN).toBe("ghp_example");
  });
});
