// The homepage shows projects in two tiers off one ordered list. The first
// eight get a card each; anything after that drops to a compact row, so the
// section can keep growing without the grid turning into a wall of panels.
export const HOMEPAGE_CARD_PROJECTS = 8;
export const MAX_PINNED_PROJECTS = 12;
export const MAX_PINNED_POSTS = 5;
export const MAX_NOW_LINKS = 4;

// Recognitions are deliberately uncapped: there is no tiering to run out of.

export function canPinProject(existingPinned: number) {
  return existingPinned < MAX_PINNED_PROJECTS;
}

export function canPinPost(existingPinned: number) {
  return existingPinned < MAX_PINNED_POSTS;
}

export function canAddNowLink(existingLinks: number) {
  return existingLinks < MAX_NOW_LINKS;
}

// Position decides the tier, nothing on the project itself: the list has
// already been sorted by pin time when it gets here.
export function splitHomepageProjects<T>(homepageProjects: T[]) {
  return {
    cards: homepageProjects.slice(0, HOMEPAGE_CARD_PROJECTS),
    rows: homepageProjects.slice(HOMEPAGE_CARD_PROJECTS),
  };
}

// What the admin prints beside a pinned row. Rank is a rendering of pin order,
// never a stored number — which is what makes two #1s or a gap at #3
// impossible, the failure mode the old display_order integers had.
export function pinRank<T extends { pinnedAt: Date | null }>(
  items: T[],
  item: T,
) {
  const pinned = items
    .filter((entry) => entry.pinnedAt)
    .sort((a, b) => b.pinnedAt!.getTime() - a.pinnedAt!.getTime());
  const at = pinned.indexOf(item);
  return at === -1 ? null : at + 1;
}

export function byDisplayOrder<T extends { displayOrder: number }>(a: T, b: T) {
  return a.displayOrder - b.displayOrder;
}
