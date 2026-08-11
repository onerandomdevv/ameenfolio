// The homepage shows projects in two tiers off one ordered list. The first
// eight get a card each; anything after that drops to a compact row, so the
// section can keep growing without the grid turning into a wall of panels.
export const HOMEPAGE_CARD_PROJECTS = 8;
export const MAX_HOMEPAGE_PROJECTS = 12;
export const MAX_NOW_LINKS = 4;

export function canAddHomepageProject(existingPublishedSelections: number) {
  return existingPublishedSelections < MAX_HOMEPAGE_PROJECTS;
}

// Position decides the tier, nothing on the project itself: homepageOrder has
// already sorted the list by the time it gets here.
export function splitHomepageProjects<T>(homepageProjects: T[]) {
  return {
    cards: homepageProjects.slice(0, HOMEPAGE_CARD_PROJECTS),
    rows: homepageProjects.slice(HOMEPAGE_CARD_PROJECTS),
  };
}

export function canAddNowLink(existingLinks: number) {
  return existingLinks < MAX_NOW_LINKS;
}

export function byDisplayOrder<T extends { displayOrder: number }>(a: T, b: T) {
  return a.displayOrder - b.displayOrder;
}
