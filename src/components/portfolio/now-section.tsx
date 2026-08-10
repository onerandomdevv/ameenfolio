import { ArrowUpRight } from "lucide-react";
import { AssetIcon } from "@/components/portfolio/asset-icon";
import { NowEmptyState } from "@/components/portfolio/now-empty-state";
import { SectionHeading } from "@/components/portfolio/section-heading";
import { Badge } from "@/components/ui/badge";
import { formatNowLastUpdated, type PublicNow } from "@/lib/now";

export function NowSection({ section }: { section: PublicNow | null }) {
  const lastUpdated = section ? formatNowLastUpdated(section.updatedAt) : null;

  return (
    <section
      className="mt-8 max-w-xl"
      aria-labelledby="now-heading"
      data-bippy-section="now"
    >
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
                    className="min-h-9 gap-2 rounded-[4px] px-3 text-sm font-semibold hover:text-primary"
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      data-bippy-reaction="curious"
                      data-bippy-safe-zone
                    >
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

          {/* Bare month and year, tucked bottom-right. It is a footnote about
              the section, not a labelled field, so the "last updated" wording
              only competed with the content it describes.

              Muted at /80 rather than dimmer: at 10px this counts as small
              text and needs 4.5:1 against the background. /70 measures 4.33:1
              and fails the contrast check. */}
          {section.showLastUpdated && lastUpdated ? (
            <p className="mt-4 text-right font-mono text-[10px] text-muted-foreground/80">
              {lastUpdated}
            </p>
          ) : null}
        </>
      ) : (
        <NowEmptyState />
      )}
    </section>
  );
}
