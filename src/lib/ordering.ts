export const MAX_HOMEPAGE_PROJECTS = 8;
export const MAX_NOW_LINKS = 6;

export function canAddHomepageProject(existingPublishedSelections: number) {
  return existingPublishedSelections < MAX_HOMEPAGE_PROJECTS;
}

export function canAddNowLink(existingLinks: number) {
  return existingLinks < MAX_NOW_LINKS;
}

export function byDisplayOrder<T extends { displayOrder: number }>(a: T, b: T) {
  return a.displayOrder - b.displayOrder;
}
