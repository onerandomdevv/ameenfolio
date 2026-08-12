import {
  Bot,
  Clock,
  Code2,
  FileText,
  Layers,
  Settings,
  Trophy,
} from "lucide-react";

// One list, two shapes: the rail on a desktop and the page picker on a phone
// both read from here, so a new section can never appear in only one of them.
export const adminSections = [
  { href: "/projects", label: "Projects", icon: Layers },
  { href: "/writing", label: "Writing", icon: FileText },
  { href: "/now", label: "Now", icon: Clock },
  { href: "/recognitions", label: "Recognitions", icon: Trophy },
  { href: "/tech-stack", label: "Tech Stack", icon: Code2 },
  { href: "/bippy", label: "Bippy", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

/**
 * Whether `href` is the section the given path belongs to.
 *
 * startsWith, so a nested route — /writing/new, /projects/x/edit — keeps its
 * section marked rather than leaving nothing selected. The trailing slash
 * matters: without it /now would also claim a hypothetical /nowhere.
 *
 * Shared by both navigations so the rail and the phone menu can never disagree
 * about where you are.
 */
export function isCurrentSection(pathname: string, base: string, href: string) {
  const full = `${base}${href}`;
  return pathname === full || pathname.startsWith(`${full}/`);
}

// On an `admin.` host, `/` is rewritten to the admin, so a relative root link
// sends "View site" back into the admin instead of the portfolio. The public
// origin has to be named rather than inferred from the current one.
export const publicSiteHref = process.env.NEXT_PUBLIC_APP_URL || "/";

export const mediaBase = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.replace(
  /\/$/,
  "",
);

export function mediaUrl(key: string) {
  return mediaBase ? `${mediaBase}/${key}` : `/media/${key}`;
}
