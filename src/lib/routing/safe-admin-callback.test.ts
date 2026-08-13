import { describe, expect, it } from "vitest";
import { safeAdminCallbackPath } from "@/lib/routing/safe-admin-callback";

describe("safeAdminCallbackPath", () => {
  it("accepts an internal admin path", () => {
    expect(safeAdminCallbackPath("/admin/assistant?thread=123")).toBe(
      "/admin/assistant?thread=123",
    );
  });

  it.each([
    "https://attacker.example",
    "//attacker.example",
    "/\\attacker.example",
    "/%5Cattacker.example",
    "/%255Cattacker.example",
  ])("rejects unsafe callback %s", (candidate) => {
    expect(safeAdminCallbackPath(candidate)).toBeUndefined();
  });

  it("rejects a backslash decoded from a search parameter", () => {
    const candidate = new URLSearchParams("next=/%5Cattacker.example").get(
      "next",
    );
    expect(safeAdminCallbackPath(candidate ?? undefined)).toBeUndefined();
  });
});
