export function canAddHomepageProject(existingPublishedSelections: number) {
  return existingPublishedSelections < 8;
}

export function canAddNowLink(existingLinks: number) {
  return existingLinks < 6;
}

export function byDisplayOrder<T extends { displayOrder: number }>(a: T, b: T) {
  return a.displayOrder - b.displayOrder;
}
