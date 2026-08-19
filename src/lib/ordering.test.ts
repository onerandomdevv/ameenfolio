import { describe, expect, it } from "vitest";
import {
  byDisplayOrder,
  canAddNowLink,
  canPinPost,
  canPinProject,
  canPinRecognition,
  HOMEPAGE_CARD_PROJECTS,
  MAX_NOW_LINKS,
  MAX_PINNED_POSTS,
  MAX_PINNED_PROJECTS,
  MAX_PINNED_RECOGNITIONS,
  pinRank,
  splitHomepageProjects,
} from "@/lib/ordering";

describe("portfolio ordering", () => {
  it("prevents a thirteenth pinned project", () => {
    expect(canPinProject(MAX_PINNED_PROJECTS - 1)).toBe(true);
    expect(canPinProject(MAX_PINNED_PROJECTS)).toBe(false);
  });

  it("prevents a sixth pinned post", () => {
    expect(canPinPost(MAX_PINNED_POSTS - 1)).toBe(true);
    expect(canPinPost(MAX_PINNED_POSTS)).toBe(false);
  });

  it("prevents a thirteenth pinned recognition", () => {
    expect(canPinRecognition(MAX_PINNED_RECOGNITIONS - 1)).toBe(true);
    expect(canPinRecognition(MAX_PINNED_RECOGNITIONS)).toBe(false);
  });

  it("prevents a fifth Now link", () => {
    expect(canAddNowLink(MAX_NOW_LINKS - 1)).toBe(true);
    expect(canAddNowLink(MAX_NOW_LINKS)).toBe(false);
  });

  it("gives the first eight a card and sends the rest to rows", () => {
    const all = Array.from({ length: MAX_PINNED_PROJECTS }, (_, i) => i);
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

  it("sorts display items in ascending administrator order", () => {
    expect(
      [{ displayOrder: 20 }, { displayOrder: 2 }].sort(byDisplayOrder),
    ).toEqual([{ displayOrder: 2 }, { displayOrder: 20 }]);
  });
});

describe("pinRank", () => {
  const at = (iso: string | null) => ({ pinnedAt: iso ? new Date(iso) : null });

  it("numbers the most recently pinned as one", () => {
    const older = at("2026-08-01T00:00:00Z");
    const newer = at("2026-08-10T00:00:00Z");
    const items = [older, newer];
    expect(pinRank(items, newer)).toBe(1);
    expect(pinRank(items, older)).toBe(2);
  });

  // Rank is read off the order, so it cannot skip a number the way a stored
  // integer could once something between two pins was unpinned.
  it("leaves no gap when something in the middle is unpinned", () => {
    const a = at("2026-08-10T00:00:00Z");
    const b = at(null);
    const c = at("2026-08-01T00:00:00Z");
    expect(pinRank([a, b, c], a)).toBe(1);
    expect(pinRank([a, b, c], c)).toBe(2);
  });

  it("has no rank for something unpinned", () => {
    const unpinned = at(null);
    expect(
      pinRank([at("2026-08-10T00:00:00Z"), unpinned], unpinned),
    ).toBeNull();
  });

  it("ranks nothing when nothing is pinned", () => {
    const only = at(null);
    expect(pinRank([only], only)).toBeNull();
  });
});
