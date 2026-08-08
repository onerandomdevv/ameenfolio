import type { NowLink, NowSection } from "@/db/schema";

export type PublicNow = NowSection & { links: NowLink[] };

export function toPublicNow(
  section: NowSection | undefined,
  links: NowLink[],
): PublicNow | null {
  return section?.published ? { ...section, links } : null;
}

export function formatNowLastUpdated(date: Date) {
  // A row written with a bad timestamp would otherwise throw RangeError out of
  // Intl and take the whole page down over one optional line of text.
  const time = date instanceof Date ? date.getTime() : Date.parse(String(date));
  if (!Number.isFinite(time)) return null;

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(time);
}
