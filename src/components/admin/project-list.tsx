import { createElement } from "react";
import { EmptyState, ListRow } from "@/components/admin/admin-primitives";
import { DeleteProjectButton } from "@/components/admin/delete-project-button";
import { PinButton, PinnedMark } from "@/components/admin/pin-button";
import { EditAction } from "@/components/admin/row-actions";
import { AssetIcon } from "@/components/portfolio/asset-icon";
import { getProjectIcon } from "@/config/project-icons";
import type { Project } from "@/db/schema";
import { pinRank } from "@/lib/ordering";

function ProjectMark({ project }: { project: Project }) {
  const stockIcon = getProjectIcon(project.iconName);
  // createElement rather than <StockIcon />: a capitalised render-scoped
  // variable trips react-hooks/static-components, which cannot tell a Map
  // lookup from a component defined inline.
  if (stockIcon) {
    return createElement(stockIcon, {
      className: "size-4",
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

const dated = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function AdminProjectList({
  projects,
  all,
  base,
  showing,
}: {
  projects: Project[];
  all: Project[];
  base: string;
  showing: "live" | "draft";
}) {
  if (!projects.length) {
    return (
      <EmptyState
        title={showing === "live" ? "Nothing on the site yet" : "No drafts"}
        description={
          showing === "live"
            ? "Projects you post will appear here."
            : "Work you save without posting will appear here."
        }
      />
    );
  }

  return (
    <div className="border-t border-border/60">
      {projects.map((project) => {
        const rank = pinRank(all, project);

        return (
          <ListRow
            key={project.id}
            icon={<ProjectMark project={project} />}
            title={project.title}
            titleMeta={rank ? <PinnedMark rank={rank} /> : null}
            meta={
              <>
                <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
                  {project.shortDescription}
                </p>
              </>
            }
            badge={
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                {project.published
                  ? dated.format(project.createdAt)
                  : `Saved ${dated.format(project.updatedAt)}`}
              </span>
            }
            actions={
              <>
                {/* Only what is on the site can be pinned — there is nowhere
                    for a draft to be pinned to. */}
                {project.published ? (
                  <PinButton
                    kind="project"
                    id={project.id}
                    pinned={Boolean(project.pinnedAt)}
                  />
                ) : null}
                <EditAction
                  href={`${base}/projects/${project.id}/edit`}
                  what={project.title}
                />
                <DeleteProjectButton id={project.id} title={project.title} />
              </>
            }
          />
        );
      })}
    </div>
  );
}
