import type { NowLink, NowSection } from "@/db/schema";

export type PublicNow = NowSection & { links: NowLink[] };

export function toPublicNow(
  section: NowSection | undefined,
  links: NowLink[],
): PublicNow | null {
  return section?.published ? { ...section, links } : null;
}

export function formatNowLastUpdated(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
