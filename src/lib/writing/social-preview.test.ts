import { describe, expect, it } from "vitest";
import {
  getSocialPreviewVersion,
  SOCIAL_PREVIEW_REVISION,
} from "@/lib/writing/social-preview";

describe("getSocialPreviewVersion", () => {
  it("combines the explicit card revision with the article update time", () => {
    const updatedAt = new Date("2026-08-14T00:00:00.000Z");

    expect(getSocialPreviewVersion(updatedAt)).toBe(
      `${SOCIAL_PREVIEW_REVISION}-${updatedAt.getTime().toString(36)}`,
    );
  });
});
