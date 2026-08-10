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
  url: "https://example.com",
  iconKey: null,
  iconAlt: null,
  iconName: "custom" as const,
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

describe("ProjectCard icons", () => {
  const render = (overrides: Partial<Project>) =>
    renderToStaticMarkup(
      createElement(ProjectCard, { project: { ...project, ...overrides } }),
    );

  it("shows a stock mark instead of the placeholder tile", () => {
    // "P" is the placeholder for a project with no icon at all. Choosing
    // GitHub or Web has to replace it, not sit alongside it.
    expect(render({ iconName: "github" })).not.toContain(">P<");
    expect(render({ iconName: "web" })).not.toContain(">P<");
  });

  it("renders a different mark for each stock option", () => {
    expect(render({ iconName: "github" })).not.toBe(
      render({ iconName: "web" }),
    );
  });

  it("falls back to the lettered tile when nothing is uploaded", () => {
    expect(render({ iconName: "custom", iconKey: null })).toContain(">P<");
  });

  it("prefers the uploaded image over the placeholder", () => {
    const html = render({
      iconName: "custom",
      iconKey: "icons/2026/" + "a".repeat(48) + ".png",
      iconAlt: "Product logo",
    });

    expect(html).toContain("Product logo");
    expect(html).not.toContain(">P<");
  });
});
