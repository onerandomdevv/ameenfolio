import { describe, expect, it } from "vitest";
import { isAdminHostSharedPath } from "./admin-host";

describe("isAdminHostSharedPath", () => {
  it("keeps the Bippy playground on the protected admin route", () => {
    expect(isAdminHostSharedPath("/bippy")).toBe(false);
  });

  it("allows Bippy's public sprite files through without an admin rewrite", () => {
    expect(isAdminHostSharedPath("/bippy/idle/bippy-idle.png")).toBe(true);
    expect(isAdminHostSharedPath("/bippy/states/working.png")).toBe(true);
  });
});
