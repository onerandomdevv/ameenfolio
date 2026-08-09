import type { ComponentType, SVGProps } from "react";
import {
  GitHubIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedInIcon,
  TikTokIcon,
  WhatsAppIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/icons/brand-icons";
import {
  AwardGlyph,
  BadgeCheckGlyph,
  CrownGlyph,
  MedalGlyph,
  SparklesGlyph,
  StarGlyph,
  TrophyGlyph,
} from "@/components/icons/glyph-icons";

export type RecognitionIcon = ComponentType<SVGProps<SVGSVGElement>>;

// The first seven names predate the brand icons and are kept exactly as they
// were: existing rows still reference them, they have only swapped a stroked
// lucide component for a solid glyph. New names are additive, so widening the
// recognitions_icon_name_valid check constraint is the only migration needed.
export const recognitionIconOptions = [
  { value: "trophy", label: "Trophy", icon: TrophyGlyph },
  { value: "award", label: "Award", icon: AwardGlyph },
  { value: "medal", label: "Medal", icon: MedalGlyph },
  { value: "star", label: "Star", icon: StarGlyph },
  { value: "badge-check", label: "Verified badge", icon: BadgeCheckGlyph },
  { value: "crown", label: "Crown", icon: CrownGlyph },
  { value: "sparkles", label: "Sparkles", icon: SparklesGlyph },
  { value: "github", label: "GitHub", icon: GitHubIcon },
  { value: "x", label: "X", icon: XIcon },
  { value: "instagram", label: "Instagram", icon: InstagramIcon },
  { value: "tiktok", label: "TikTok", icon: TikTokIcon },
  { value: "linkedin", label: "LinkedIn", icon: LinkedInIcon },
  { value: "whatsapp", label: "WhatsApp", icon: WhatsAppIcon },
  { value: "youtube", label: "YouTube", icon: YouTubeIcon },
  { value: "globe", label: "Web", icon: GlobeIcon },
] as const satisfies readonly {
  value: string;
  label: string;
  icon: RecognitionIcon;
}[];

export const recognitionIconNames = recognitionIconOptions.map(
  (option) => option.value,
) as unknown as readonly [RecognitionIconName, ...RecognitionIconName[]];

export type RecognitionIconName =
  (typeof recognitionIconOptions)[number]["value"];

const iconsByName = Object.fromEntries(
  recognitionIconOptions.map((option) => [option.value, option.icon]),
) as Record<RecognitionIconName, RecognitionIcon>;

export function getRecognitionIcon(iconName: RecognitionIconName | string) {
  return iconsByName[iconName as RecognitionIconName] ?? TrophyGlyph;
}
