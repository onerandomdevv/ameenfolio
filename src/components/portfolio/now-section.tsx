import { ArrowUpRight } from "lucide-react";
import { AssetIcon } from "@/components/portfolio/asset-icon";
import { NowEmptyState } from "@/components/portfolio/now-empty-state";
import { SectionHeading } from "@/components/portfolio/section-heading";
import { Badge } from "@/components/ui/badge";
import { formatNowLastUpdated, type PublicNow } from "@/lib/now";

export function NowSection({ section }: { section: PublicNow | null }) {
  return (
    <section className="mt-8 max-w-xl" aria-labelledby="now-heading">
      <SectionHeading id="now-heading" title="Now" />
      {section ? (
        <>
          <p className="mt-5 text-pretty text-[15px] leading-7 text-foreground/90">
            {section.description}
          </p>

          {section.links.length ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {section.links.map((item) => (
                <li key={item.id}>
                  <Badge
                    asChild
                    variant="secondary"
                    className="min-h-9 px-3 hover:text-primary"
                  >
                    <a href={item.url} target="_blank" rel="noreferrer">
                      <AssetIcon
                        objectKey={item.iconKey}
                        alt={item.iconAlt ?? ""}
                        size="xs"
                      />
                      {item.label}
                      <ArrowUpRight aria-hidden="true" />
                    </a>
                  </Badge>
                </li>
              ))}
            </ul>
          ) : null}

          {section.showLastUpdated ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Last updated {formatNowLastUpdated(section.updatedAt)}
            </p>
          ) : null}
        </>
      ) : (
        <NowEmptyState />
      )}
    </section>
  );
}
