// A post's slug is its address, so it is generated once from the title and
// then left alone: editing a published title must not silently break every
// link to it. The admin form lets the owner change it deliberately.
export function slugifyTitle(title: string) {
  return (
    title
      .normalize("NFKD")
      // Strip accents rather than dropping the letters they sit on, so "Résumé"
      // becomes "resume" and not "rsum".
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80)
      .replace(/-+$/g, "")
  );
}

// The slug column is unique, so a second post called "Notes on caching" needs
// a suffix rather than a failed save.
export function uniqueSlug(base: string, taken: Iterable<string>) {
  const existing = new Set(taken);
  if (!existing.has(base)) return base;
  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!existing.has(candidate)) return candidate;
  }
  throw new Error("Could not find a free slug.");
}
