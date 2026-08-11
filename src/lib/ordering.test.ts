import { describe, expect, it } from "vitest";
import {
  byDisplayOrder,
  canAddHomepageProject,
  canAddNowLink,
  canPinPost,
  HOMEPAGE_CARD_PROJECTS,
  MAX_HOMEPAGE_PROJECTS,
  MAX_NOW_LINKS,
  MAX_PINNED_POSTS,
  splitHomepageProjects,
} from "@/lib/ordering";

describe("portfolio ordering", () => {
  it("prevents a thirteenth homepage project", () => {
    expect(canAddHomepageProject(MAX_HOMEPAGE_PROJECTS - 1)).toBe(true);
    expect(canAddHomepageProject(MAX_HOMEPAGE_PROJECTS)).toBe(false);
  });

  it("gives the first eight a card and sends the rest to rows", () => {
    const all = Array.from({ length: MAX_HOMEPAGE_PROJECTS }, (_, i) => i);
    const { cards, rows } = splitHomepageProjects(all);
    expect(cards).toHaveLength(HOMEPAGE_CARD_PROJECTS);
    expect(rows).toEqual([8, 9, 10, 11]);
  });

  // The row tier is an overflow, so a short list must not render an empty
  // divided block under the grid.
  it("leaves the row tier empty until the cards are full", () => {
    const { cards, rows } = splitHomepageProjects([1, 2, 3]);
    expect(cards).toHaveLength(3);
    expect(rows).toEqual([]);
  });

  it("prevents a sixth pinned post", () => {
    expect(canPinPost(MAX_PINNED_POSTS - 1)).toBe(true);
    expect(canPinPost(MAX_PINNED_POSTS)).toBe(false);
  });

  it("sorts display items in ascending administrator order", () => {
    expect(
      [{ displayOrder: 20 }, { displayOrder: 2 }].sort(byDisplayOrder),
    ).toEqual([{ displayOrder: 2 }, { displayOrder: 20 }]);
  });

  it("prevents a fifth Now link", () => {
    expect(canAddNowLink(MAX_NOW_LINKS - 1)).toBe(true);
    expect(canAddNowLink(MAX_NOW_LINKS)).toBe(false);
  });
});
