import { SectionHeading } from "@/components/portfolio/section-heading";
import { Badge } from "@/components/ui/badge";
import { techStackGroups } from "@/config/tech-stack";

export function TechStackSection() {
  return (
    <section
      className="mt-24"
      aria-labelledby="stack-heading"
      data-bippy-section="stack"
    >
      <SectionHeading id="stack-heading" title="Tech Stack" />
      <div className="mt-8 flex flex-col gap-8">
        {techStackGroups.map((group) => (
          <div key={group.id}>
            <h3 className="text-xs font-normal text-muted-foreground">
              {group.name}
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {group.items.map((technology) => (
                <li key={technology.id}>
                  <Badge
                    variant="secondary"
                    className="min-h-9 gap-2 rounded-[4px] px-3"
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-5 place-items-center rounded-[2px] border border-background/25 bg-foreground text-[8px] font-semibold leading-none text-background"
                    >
                      {technology.abbreviation}
                    </span>
                    <span>{technology.name}</span>
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
