import { SectionHeading } from "@/components/portfolio/section-heading";
import { Badge } from "@/components/ui/badge";
import { techStackGroups } from "@/config/tech-stack";
import type { TechStackItem } from "@/db/schema";

export function TechStackSection({ items }: { items: TechStackItem[] }) {
  // Groups with nothing in them are dropped rather than rendered as a heading
  // over empty space, so emptying one from the admin removes it cleanly.
  const groups = techStackGroups
    .map((group) => ({
      ...group,
      items: items.filter((item) => item.groupKey === group.value),
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
      <div className="mt-8 flex flex-col gap-8">
        {groups.map((group) => (
          <div key={group.value}>
            <h3 className="text-xs font-normal text-accent-lime">
              {group.label}
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {group.items.map((technology) => (
                <li key={technology.id}>
                  <Badge
                    variant="secondary"
                    className="min-h-9 rounded-[4px] px-3"
                  >
                    {technology.name}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
