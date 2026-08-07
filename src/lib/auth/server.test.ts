import { describe, expect, it } from "vitest";
import { isAllowedAdminAccount } from "@/lib/auth/guards";

describe("admin authorization", () => {
  it("accepts only the configured GitHub provider account", () => {
    expect(
      isAllowedAdminAccount(
        [{ providerId: "github", accountId: "231661599" }],
        "231661599",
      ),
    ).toBe(true);
    expect(
      isAllowedAdminAccount(
        [{ providerId: "github", accountId: "999" }],
        "231661599",
      ),
    ).toBe(false);
    expect(
      isAllowedAdminAccount(
        [{ providerId: "google", accountId: "231661599" }],
        "231661599",
      ),
    ).toBe(false);
  });
});
