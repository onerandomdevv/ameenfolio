import {
  Award,
  BadgeCheck,
  Crown,
  Medal,
  Sparkles,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export const recognitionIconNames = [
  "trophy",
  "award",
  "medal",
  "star",
  "badge-check",
  "crown",
  "sparkles",
] as const;

export type RecognitionIconName = (typeof recognitionIconNames)[number];

export const recognitionIconOptions = [
  { value: "trophy", label: "Trophy", icon: Trophy },
  { value: "award", label: "Award", icon: Award },
  { value: "medal", label: "Medal", icon: Medal },
  { value: "star", label: "Star", icon: Star },
  { value: "badge-check", label: "Verified badge", icon: BadgeCheck },
  { value: "crown", label: "Crown", icon: Crown },
  { value: "sparkles", label: "Sparkles", icon: Sparkles },
] as const satisfies readonly {
  value: RecognitionIconName;
  label: string;
  icon: LucideIcon;
}[];

const iconsByName = Object.fromEntries(
  recognitionIconOptions.map((option) => [option.value, option.icon]),
) as Record<RecognitionIconName, LucideIcon>;

export function getRecognitionIcon(iconName: RecognitionIconName | string) {
  return iconsByName[iconName as RecognitionIconName] ?? Trophy;
}
