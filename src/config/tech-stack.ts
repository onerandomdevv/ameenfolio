// The two groups are fixed; their contents are not. Items live in the database
// and are managed from the admin, so adding a technology is content editing
// rather than a deploy.
export const techStackGroups = [
  { value: "core", label: "Core Stack" },
  { value: "tools", label: "Tools & Infrastructure" },
] as const;

export type TechStackGroupValue = (typeof techStackGroups)[number]["value"];

export const techStackGroupValues = techStackGroups.map(
  (group) => group.value,
) as unknown as readonly [TechStackGroupValue, ...TechStackGroupValue[]];

export function techStackGroupLabel(value: TechStackGroupValue | string) {
  return (
    techStackGroups.find((group) => group.value === value)?.label ??
    techStackGroups[0].label
  );
}
