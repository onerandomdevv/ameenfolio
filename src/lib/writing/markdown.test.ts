import { describe, expect, it } from "vitest";
import { renderMarkdown } from "@/lib/writing/markdown";
import { slugifyTitle, uniqueSlug } from "@/lib/writing/slug";

describe("slugifyTitle", () => {
  it("makes an address out of a title", () => {
    expect(slugifyTitle("Up and Running with AWS EC2")).toBe(
      "up-and-running-with-aws-ec2",
    );
  });

  // Stripping the accent rather than the letter: otherwise "Résumé" loses its
  // vowels instead of its diacritics.
  it("keeps accented letters as their base letter", () => {
    expect(slugifyTitle("Réécrire mon Résumé")).toBe("reecrire-mon-resume");
  });

  it("does not leave punctuation as trailing dashes", () => {
    expect(slugifyTitle("What is CAP Theorem?")).toBe("what-is-cap-theorem");
    expect(slugifyTitle("  Spaced  out  ")).toBe("spaced-out");
  });

  it("suffixes a slug that is already taken", () => {
    expect(uniqueSlug("notes", [])).toBe("notes");
    expect(uniqueSlug("notes", ["notes"])).toBe("notes-2");
    expect(uniqueSlug("notes", ["notes", "notes-2"])).toBe("notes-3");
  });
});

describe("renderMarkdown", () => {
  it("renders headings with the ids the contents list links to", async () => {
    const { html, headings } = await renderMarkdown(
      "# Title\n\n## First section\n\ntext\n\n### Nested\n\n## Second section",
    );
    expect(headings).toEqual([
      { id: "first-section", text: "First section", level: 2 },
      { id: "nested", text: "Nested", level: 3 },
      { id: "second-section", text: "Second section", level: 2 },
    ]);
    expect(html).toContain('id="first-section"');
  });

  // The H1 is the post title, rendered by the page itself.
  it("leaves the top-level heading out of the contents", async () => {
    const { headings } = await renderMarkdown("# Just a title\n\nbody");
    expect(headings).toEqual([]);
  });

  it("keeps images, which is how diagrams get in", async () => {
    const { html } = await renderMarkdown(
      "![A retry diagram](/media/posts/2026/abc.png)",
    );
    expect(html).toContain('src="/media/posts/2026/abc.png"');
    expect(html).toContain('alt="A retry diagram"');
    expect(html).toContain('loading="lazy"');
  });

  it("highlights fenced code", async () => {
    const { html } = await renderMarkdown(
      "```ts\nconst answer: number = 42;\n```",
    );
    expect(html).toContain("<pre");
    expect(html).toContain("hljs");
  });

  it("supports tables and strikethrough from GFM", async () => {
    const { html } = await renderMarkdown(
      "| a | b |\n| - | - |\n| 1 | 2 |\n\n~~gone~~",
    );
    expect(html).toContain("<table");
    expect(html).toContain("<del>");
  });

  // Otherwise a keyboard user cannot scroll a wide code sample on a phone,
  // which axe reports as a serious violation.
  it("lets keyboard users reach blocks that scroll sideways", async () => {
    const code = await renderMarkdown("```ts\nconst a = 1;\n```");
    expect(code.html).toContain('<pre tabindex="0"');
    const table = await renderMarkdown("| a | b |\n| - | - |\n| 1 | 2 |");
    expect(table.html).toContain('<table tabindex="0"');
  });

  it("sends outward links away from the site", async () => {
    const { html } = await renderMarkdown("[docs](https://example.com/docs)");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer"');
  });

  // Internal links stay in the tab: they go to other pages on this site.
  it("leaves internal links alone", async () => {
    const { html } = await renderMarkdown("[projects](/projects)");
    expect(html).not.toContain("target=");
  });

  // Not a defence against the author, who is the owner. A defence against
  // pasting a sample that carries markup with it.
  it("strips scripts and inline handlers that arrive by paste", async () => {
    const { html } = await renderMarkdown(
      'text <script>alert(1)</script> <img src=x onerror="alert(1)"> <a href="javascript:alert(1)">x</a>',
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("javascript:");
  });
});
