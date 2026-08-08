import { describe, expect, it } from "vitest";
import { formatNowLastUpdated, toPublicNow } from "@/lib/now";

const section = {
  id: 1,
  description: "Building useful tools for people on the web.",
  published: true,
  showLastUpdated: true,
  updatedAt: new Date("2026-08-07T10:00:00.000Z"),
};

describe("Now section public behavior", () => {
  it("omits an unpublished section", () => {
    expect(toPublicNow({ ...section, published: false }, [])).toBeNull();
  });

  it("keeps a published section with no links", () => {
    expect(toPublicNow(section, [])).toEqual({ ...section, links: [] });
  });

  it("formats the update month in UTC", () => {
    expect(formatNowLastUpdated(section.updatedAt)).toBe("August 2026");
  });
});
