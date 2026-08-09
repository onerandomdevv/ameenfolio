import { SectionHeading } from "@/components/portfolio/section-heading";
import { Badge } from "@/components/ui/badge";
import { techStackGroups } from "@/config/tech-stack";

export function TechStackSection() {
  return (
    <section
      className="mt-14"
      aria-labelledby="stack-heading"
      data-bippy-section="stack"
    >
      <SectionHeading id="stack-heading" title="Tech Stack" />
      <div className="mt-8 flex flex-col gap-8">
        {techStackGroups.map((group) => (
          <div key={group.id}>
            <h3 className="text-xs font-normal text-accent-lime">
              {group.name}
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
