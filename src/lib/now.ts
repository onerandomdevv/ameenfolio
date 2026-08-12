import type { NowLink, NowSection } from "@/db/schema";

export type PublicNow = NowSection & { links: NowLink[] };

export function toPublicNow(
  section: NowSection | undefined,
  links: NowLink[],
): PublicNow | null {
  return section?.published ? { ...section, links } : null;
}
