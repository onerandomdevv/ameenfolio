import { describe, expect, it } from "vitest";
import {
  createObjectKey,
  isPublicIconKey,
  isManagedObjectKey,
  validateUpload,
} from "@/lib/storage/rules";

describe("R2 asset safety", () => {
  it("generates unpredictable allowlisted icon keys", () => {
    const key = createObjectKey("icon", "image/webp", new Date("2026-08-07"));
    expect(key).toMatch(/^icons\/2026\/[a-f0-9]{48}\.webp$/);
    expect(isPublicIconKey(key)).toBe(true);
  });

  it("rejects traversal and executable media", () => {
    expect(isPublicIconKey("icons/2026/../../secret.pdf")).toBe(false);
    expect(isManagedObjectKey("resumes/2026/../../secret.pdf")).toBe(false);
    expect(validateUpload("icon", "image/svg+xml", 100)).toBe(false);
    expect(validateUpload("resume", "text/html", 100)).toBe(false);
  });

  it("enforces upload size limits", () => {
    expect(validateUpload("icon", "image/png", 2 * 1024 * 1024)).toBe(true);
    expect(validateUpload("icon", "image/png", 2 * 1024 * 1024 + 1)).toBe(
      false,
    );
  });
});
