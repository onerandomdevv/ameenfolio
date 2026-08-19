import { createElement } from "react";
import { ArrowUpRight, User } from "lucide-react";
import type { Project } from "@/db/schema";
import { AssetIcon } from "@/components/portfolio/asset-icon";
import { getProjectIcon } from "@/config/project-icons";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// A stock mark stands in when the project has no logo of its own. It renders
// as a bare glyph rather than inside the uploaded icon's tile, so a GitHub or
// web mark reads like the brand icons elsewhere on the page instead of like a
// picture someone uploaded.
function ProjectIconMark({ project }: { project: Project }) {
  const stockIcon = getProjectIcon(project.iconName);

  // createElement rather than <StockIcon />: a capitalised render-scoped
  // variable trips react-hooks/static-components, which cannot tell a Map
  // lookup from a component defined inline. Same approach as RecognitionRow.
  if (stockIcon) {
    return createElement(stockIcon, {
      className: "size-5 shrink-0 text-foreground",
      "aria-hidden": true,
    });
  }

  return (
    <AssetIcon
      objectKey={project.iconKey}
      alt={project.iconAlt ?? ""}
      size="xs"
      fallbackLabel="P"
    />
  );
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <a
      href={project.url}
      target="_blank"
      rel="noreferrer"
      data-bippy-reaction="curious"
      data-bippy-project
      data-bippy-safe-zone
      className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {/* The lifted surface is the resting state, not a hover effect — a card
          should read as a raised panel all the time. Nothing changes on hover
          except the arrow going lime, so contact does not restyle the card. */}
      <Card className="h-full gap-0 border-border bg-accent/40 py-4 text-left shadow-none">
        <CardHeader className="grid-cols-[1fr_auto] px-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {/* The icon rides in the header beside the title rather than
                sitting on its own row, which is what keeps the card to a
                header-plus-description block instead of three stacked bands. */}
            <ProjectIconMark project={project} />
            <CardTitle>
              <h3 className="text-sm font-semibold">{project.title}</h3>
            </CardTitle>
            {project.statusLabel ? (
              <Badge
                variant="default"
                className="rounded-[4px] px-1.5 py-0 font-mono text-[10px] uppercase tracking-[0.08em]"
              >
                {project.statusLabel}
              </Badge>
            ) : null}
          </div>
          <CardAction className="text-muted-foreground transition-colors group-hover:text-signal group-focus-visible:text-signal">
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col px-4 pt-2">
          <p className="text-[13px] leading-6 text-muted-foreground">
            {project.shortDescription}
          </p>
          {project.contribution ? (
            // Rendered as typed. The uppercase transform decided the casing
            // for the owner; the letter-spacing went with it, since it only
            // existed to keep capitals legible.
            <p className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] text-foreground/70">
              <User className="size-3.5 shrink-0" aria-hidden="true" />
              {project.contribution}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </a>
  );
}
