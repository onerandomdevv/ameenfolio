import { portfolioIdentity } from "@/config/portfolio";
import type { SiteSettings } from "@/db/schema";

export type Identity = {
  name: string;
  role: string;
  introduction: string;
};

/**
 * The name, role and introduction as the site should show them.
 *
 * A stored value wins; a blank or absent one falls back to the shipped copy, so
 * a site that has never opened the admin still reads correctly. Everything that
 * displays these — the homepage, the page title, the share card — resolves them
 * here, because a second copy of this rule is how the share preview ends up
 * naming someone the page no longer does.
 */
export function resolveIdentity(
  settings: Pick<SiteSettings, "displayName" | "role" | "introduction">,
): Identity {
  return {
    name: settings.displayName?.trim() || portfolioIdentity.name,
    role: settings.role?.trim() || portfolioIdentity.role,
    introduction:
      settings.introduction?.trim() || portfolioIdentity.introduction,
  };
}

export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
