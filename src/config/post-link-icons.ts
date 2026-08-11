import type { ComponentType, SVGProps } from "react";
import {
  GitHubIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedInIcon,
  TikTokIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/icons/brand-icons";
import { MailGlyph, SparklesGlyph } from "@/components/icons/glyph-icons";

export type PostLinkIcon = ComponentType<SVGProps<SVGSVGElement>>;

// The marks a post can point outwards with. Deliberately the destinations a
// piece of writing actually ends on — the repository it discusses, the video
// version, the thread where it was argued about — rather than every brand mark
// the site owns.
export const postLinkIconOptions = [
  { value: "link", label: "Link", icon: GlobeIcon },
  { value: "github", label: "GitHub", icon: GitHubIcon },
  { value: "x", label: "X", icon: XIcon },
  { value: "youtube", label: "YouTube", icon: YouTubeIcon },
  { value: "linkedin", label: "LinkedIn", icon: LinkedInIcon },
  { value: "instagram", label: "Instagram", icon: InstagramIcon },
  { value: "tiktok", label: "TikTok", icon: TikTokIcon },
  { value: "mail", label: "Email", icon: MailGlyph },
  { value: "sparkles", label: "Something else", icon: SparklesGlyph },
] as const satisfies readonly {
  value: string;
  label: string;
  icon: PostLinkIcon;
}[];

export type PostLinkIconName = (typeof postLinkIconOptions)[number]["value"];

export const postLinkIconValues = postLinkIconOptions.map(
  (option) => option.value,
) as unknown as readonly [PostLinkIconName, ...PostLinkIconName[]];

export const defaultPostLinkIcon: PostLinkIconName = "link";

// A Map rather than an object literal, for the same reason as the project
// icons: this is looked up with an arbitrary string from the database, and a
// plain object answers "constructor" with an inherited function.
const iconsByName = new Map<string, PostLinkIcon>(
  postLinkIconOptions.map((option) => [option.value, option.icon]),
);

export function getPostLinkIcon(iconName: PostLinkIconName | string) {
  return iconsByName.get(iconName) ?? null;
}
