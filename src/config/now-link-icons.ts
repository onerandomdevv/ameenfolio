import type { ComponentType, SVGProps } from "react";
import {
  GitHubIcon,
  GlobeIcon,
  InstagramIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/icons/brand-icons";

export type NowLinkIcon = ComponentType<SVGProps<SVGSVGElement>>;

// The real marks, the same ones the contact row uses — not lucide's outlines,
// which read as generic glyphs next to a brand. A link with no uploaded image
// falls back to one of these, and the globe is what an unrecognised link gets.
export const nowLinkIconOptions = [
  { value: "web", label: "Web", icon: GlobeIcon },
  { value: "github", label: "GitHub", icon: GitHubIcon },
  { value: "x", label: "X", icon: XIcon },
  { value: "instagram", label: "Instagram", icon: InstagramIcon },
  { value: "youtube", label: "YouTube", icon: YouTubeIcon },
] as const satisfies readonly {
  value: string;
  label: string;
  icon: NowLinkIcon;
}[];

export type NowLinkIconName = (typeof nowLinkIconOptions)[number]["value"];

export const nowLinkIconValues = nowLinkIconOptions.map(
  (option) => option.value,
) as unknown as readonly [NowLinkIconName, ...NowLinkIconName[]];

export const DEFAULT_NOW_LINK_ICON: NowLinkIconName = "web";

export function getNowLinkIcon(name?: string | null): NowLinkIcon {
  return (
    nowLinkIconOptions.find((option) => option.value === name)?.icon ??
    GlobeIcon
  );
}
