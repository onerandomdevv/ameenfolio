import type { ComponentType, SVGProps } from "react";
import { GitHubIcon, GlobeIcon } from "@/components/icons/brand-icons";

export type ProjectIcon = ComponentType<SVGProps<SVGSVGElement>>;

// Three ways to mark a project: an uploaded image, or one of two stock marks
// for the common cases where a project has no logo of its own — a repository
// and a live site.
export const projectIconOptions = [
  {
    value: "custom",
    label: "Uploaded image",
    hint: "Use the icon uploaded below.",
    icon: null,
  },
  {
    value: "github",
    label: "GitHub",
    hint: "For a repository with no logo of its own.",
    icon: GitHubIcon,
  },
  {
    value: "web",
    label: "Web",
    hint: "For a live site with no logo of its own.",
    icon: GlobeIcon,
  },
] as const satisfies readonly {
  value: string;
  label: string;
  hint: string;
  icon: ProjectIcon | null;
}[];

export type ProjectIconName = (typeof projectIconOptions)[number]["value"];

export const projectIconValues = projectIconOptions.map(
  (option) => option.value,
) as unknown as readonly [ProjectIconName, ...ProjectIconName[]];

export const defaultProjectIcon: ProjectIconName = "custom";

// A Map rather than an object literal: this is looked up with an arbitrary
// string from the database, and a plain object answers "constructor" with an
// inherited function that React would then be handed as a component.
const iconsByName = new Map<string, ProjectIcon>(
  projectIconOptions
    .filter((option): option is typeof option & { icon: ProjectIcon } =>
      Boolean(option.icon),
    )
    .map((option) => [option.value, option.icon]),
);

export function getProjectIcon(iconName: ProjectIconName | string) {
  return iconsByName.get(iconName) ?? null;
}
