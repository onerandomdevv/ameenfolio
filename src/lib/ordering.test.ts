import { describe, expect, it } from "vitest";
import {
  byDisplayOrder,
  canAddHomepageProject,
  canAddNowLink,
} from "@/lib/ordering";

describe("portfolio ordering", () => {
  it("prevents a ninth homepage project", () => {
    expect(canAddHomepageProject(7)).toBe(true);
    expect(canAddHomepageProject(8)).toBe(false);
  });

  it("sorts display items in ascending administrator order", () => {
    expect(
      [{ displayOrder: 20 }, { displayOrder: 2 }].sort(byDisplayOrder),
    ).toEqual([{ displayOrder: 2 }, { displayOrder: 20 }]);
  });

  it("prevents a seventh Now link", () => {
    expect(canAddNowLink(5)).toBe(true);
    expect(canAddNowLink(6)).toBe(false);
  });
});
