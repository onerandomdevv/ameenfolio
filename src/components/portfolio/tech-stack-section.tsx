import { SectionHeading } from "@/components/portfolio/section-heading";
import { TechStackGroups } from "@/components/portfolio/tech-stack-groups";
import { techStackGroups } from "@/config/tech-stack";
import type { TechStackItem } from "@/db/schema";

export function TechStackSection({ items }: { items: TechStackItem[] }) {
  // Groups with nothing in them are dropped rather than rendered as a heading
  // over empty space, so emptying one from the admin removes it cleanly.
  const groups = techStackGroups
    .map((group) => ({
      value: group.value,
      label: group.label,
      // Only what the list needs, so the whole row does not cross to the client.
      items: items
        .filter((item) => item.groupKey === group.value)
        .map((item) => ({ id: item.id, name: item.name })),
    }))
    .filter((group) => group.items.length > 0);

  if (!groups.length) return null;

  return (
    <section
      className="mt-14"
      aria-labelledby="stack-heading"
      data-bippy-section="stack"
    >
      <SectionHeading id="stack-heading" title="Tech Stack" />
      <TechStackGroups groups={groups} />
    </section>
  );
}
