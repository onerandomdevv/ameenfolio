import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProjectCard } from "@/components/portfolio/project-card";
import type { Project } from "@/db/schema";

const project = {
  id: "f03acb77-c9e3-4e6c-b911-74421ad99d50",
  title: "Focused product",
  shortDescription: "A concise description of the product and its purpose.",
  contribution: "Designed and built the product end to end.",
  statusLabel: "Live",
  liveUrl: "https://example.com",
  githubUrl: "https://github.com/example/project",
  iconKey: null,
  iconAlt: null,
  showOnHomepage: true,
  homepageOrder: 1,
  published: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
} satisfies Project;

describe("ProjectCard", () => {
  it("uses the whole card as the single link to the live project", () => {
    const html = renderToStaticMarkup(createElement(ProjectCard, { project }));

    expect(html).toContain(
      '<a href="https://example.com" target="_blank" rel="noreferrer"',
    );
    expect(html.match(/<a\b/g)).toHaveLength(1);
    expect(html).not.toContain("View live");
    expect(html).not.toContain("Source");
  });
});
