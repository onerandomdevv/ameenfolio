import { describe, expect, it } from "vitest";
import {
  byDisplayOrder,
  canAddHomepageProject,
  canAddNowLink,
  MAX_HOMEPAGE_PROJECTS,
  MAX_NOW_LINKS,
} from "@/lib/ordering";

describe("portfolio ordering", () => {
  it("prevents a ninth homepage project", () => {
    expect(canAddHomepageProject(MAX_HOMEPAGE_PROJECTS - 1)).toBe(true);
    expect(canAddHomepageProject(MAX_HOMEPAGE_PROJECTS)).toBe(false);
  });

  it("sorts display items in ascending administrator order", () => {
    expect(
      [{ displayOrder: 20 }, { displayOrder: 2 }].sort(byDisplayOrder),
    ).toEqual([{ displayOrder: 2 }, { displayOrder: 20 }]);
  });

  it("prevents a seventh Now link", () => {
    expect(canAddNowLink(MAX_NOW_LINKS - 1)).toBe(true);
    expect(canAddNowLink(MAX_NOW_LINKS)).toBe(false);
  });
});
