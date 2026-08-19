import { describe, expect, it } from "vitest";
import { isAdminHostSharedPath, restoreAdminHostRedirect } from "./admin-host";

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

  it("restores the browser-facing path after an admin-host auth exchange", () => {
    expect(
      restoreAdminHostRedirect(
        "https://onerandomdev.cv/admin/mcp/authorize?state=kept",
        "https://admin.onerandomdev.cv/mcp/authorize",
        "admin.onerandomdev.cv",
      ).toString(),
    ).toBe("https://admin.onerandomdev.cv/mcp/authorize?state=kept");

    expect(
      restoreAdminHostRedirect(
        "https://onerandomdev.cv/admin/assistant",
        "https://admin.onerandomdev.cv/assistant",
        "admin.onerandomdev.cv",
      ).toString(),
    ).toBe("https://admin.onerandomdev.cv/assistant");
  });
});
