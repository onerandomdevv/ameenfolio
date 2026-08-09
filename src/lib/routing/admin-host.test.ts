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

  it("allows only the generated admin icon through the hidden admin prefix", () => {
    expect(isAdminHostSharedPath("/admin/icon.png")).toBe(true);
    expect(isAdminHostSharedPath("/admin")).toBe(false);
    expect(isAdminHostSharedPath("/admin/projects")).toBe(false);
  });
});
