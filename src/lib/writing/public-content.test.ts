import { describe, expect, it } from "vitest";
import {
  articleAsMarkdown,
  articleDescription,
  articleJsonLd,
  toPublicArticle,
} from "@/lib/writing/public-content";

const source = {
  id: "private-database-id",
  title: "Building Bippy",
  slug: "building-bippy",
  bodyMarkdown: "## A controlled agent\n\nBippy manages published work safely.",
  bodyHtml:
    '<h2 id="a-controlled-agent">A controlled agent</h2><p>Bippy manages published work safely.</p>',
  headings: [
    { id: "a-controlled-agent", text: "A controlled agent", level: 2 },
  ],
  publishedAt: new Date("2026-08-13T00:00:00.000Z"),
  updatedAt: new Date("2026-08-21T12:00:00.000Z"),
  published: true,
  resumeKey: "private/resume.pdf",
};

describe("public writing representations", () => {
  it("derives a concise plain-text description from Markdown", () => {
    expect(
      articleDescription(
        "# Heading\n\nRead [the article](https://example.com) with `code`.",
        "Fallback",
      ),
    ).toBe("Heading Read the article with code.");
  });

  it("allows only the explicit public article fields", () => {
    const article = toPublicArticle(
      source,
      [{ label: "Repository", url: "https://github.com/example/repo" }],
      "https://onerandomdev.cv",
    );

    expect(article).not.toHaveProperty("id");
    expect(article).not.toHaveProperty("published");
    expect(article).not.toHaveProperty("resumeKey");
    expect(article.url).toBe("https://onerandomdev.cv/writing/building-bippy");
    expect(article.markdownUrl).toBe(`${article.url}.md`);
  });

  it("builds self-contained Markdown and Article JSON-LD", () => {
    const article = toPublicArticle(source, [], "https://onerandomdev.cv");
    const markdown = articleAsMarkdown(article);
    const jsonLd = articleJsonLd(article, {
      name: "Aliameen Kareem",
      url: "https://onerandomdev.cv",
    });

    expect(markdown).toContain("# Building Bippy");
    expect(markdown).toContain("Bippy manages published work safely.");
    expect(jsonLd).toMatchObject({
      "@type": "Article",
      headline: "Building Bippy",
      datePublished: "2026-08-13T00:00:00.000Z",
      dateModified: "2026-08-21T12:00:00.000Z",
    });
  });
});
