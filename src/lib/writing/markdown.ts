import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { toString } from "hast-util-to-string";
import type { Root } from "hast";
import type { PostHeading } from "@/db/schema";

// Markdown is rendered when a post is saved, not when it is read. The public
// pages are force-dynamic, so parsing on read would repeat the same work for
// every visitor to produce a result that only changes on save.

// Only the owner writes these posts, so this is not a defence against a
// hostile author. It is a defence against paste: a code sample copied from a
// page carrying an inline handler should not become live markup on this site.
const schema = {
  ...defaultSchema,
  // Without this, every heading id is rewritten to "user-content-<id>" to
  // stop content ids clobbering DOM properties. That protection is aimed at
  // hostile input; here the author is the site owner, and the cost is that
  // every anchor in a shared URL carries the prefix. Headings are collected
  // after this step regardless, so the contents list always links to whatever
  // id actually survives.
  clobberPrefix: "",
  attributes: {
    ...defaultSchema.attributes,
    // rehype-highlight marks tokens with these, and the default schema does
    // not know to keep them.
    code: [...(defaultSchema.attributes?.code ?? []), "className"],
    span: [...(defaultSchema.attributes?.span ?? []), "className"],
    pre: [...(defaultSchema.attributes?.pre ?? []), "className", "tabIndex"],
    table: [...(defaultSchema.attributes?.table ?? []), "tabIndex"],
    // target and rel are added above and would otherwise be stripped here.
    a: [...(defaultSchema.attributes?.a ?? []), "target", "rel"],
    // Heading ids are what the contents list links to.
    h2: [...(defaultSchema.attributes?.h2 ?? []), "id"],
    h3: [...(defaultSchema.attributes?.h3 ?? []), "id"],
    h4: [...(defaultSchema.attributes?.h4 ?? []), "id"],
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      "src",
      "alt",
      "title",
      "loading",
    ],
  },
};

// Collected from the tree rather than re-parsed from the HTML afterwards, so
// the ids here are guaranteed to be the ones rehype-slug actually wrote.
function collectHeadings(headings: PostHeading[]) {
  return () => (tree: Root) => {
    visit(tree, "element", (node) => {
      const level = Number(/^h([2-4])$/.exec(node.tagName)?.[1]);
      if (!level) return;
      const id = node.properties?.id;
      if (typeof id !== "string") return;
      headings.push({ id, text: toString(node), level });
    });
  };
}

// Links out of a post go to other people's sites, so they open away from this
// one and do not hand over referrer or window access.
function hardenExternalLinks() {
  return (tree: Root) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "a") return;
      const href = node.properties?.href;
      if (typeof href !== "string" || !/^https?:\/\//i.test(href)) return;
      node.properties = {
        ...node.properties,
        target: "_blank",
        // A list, not a string: hast models rel as space-separated tokens and
        // stringifies them back out on the way to HTML.
        rel: ["noreferrer"],
      };
    });
  };
}

// A block that scrolls sideways is unreachable for anyone without a mouse
// unless it can take focus. Code samples and wide tables both scroll inside
// themselves on narrow screens, so both get it.
function focusableScrollRegions() {
  return (tree: Root) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "pre" && node.tagName !== "table") return;
      node.properties = { ...node.properties, tabIndex: 0 };
    });
  };
}

function lazyLoadImages() {
  return (tree: Root) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "img") return;
      node.properties = { ...node.properties, loading: "lazy" };
    });
  };
}

export type RenderedMarkdown = {
  html: string;
  headings: PostHeading[];
};

export async function renderMarkdown(
  markdown: string,
): Promise<RenderedMarkdown> {
  const headings: PostHeading[] = [];

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeHighlight, { detect: true })
    .use(hardenExternalLinks)
    .use(lazyLoadImages)
    .use(focusableScrollRegions)
    // Sanitising before the headings are collected, so the contents list can
    // only ever point at ids that survived it.
    .use(rehypeSanitize, schema)
    .use(collectHeadings(headings))
    .use(rehypeStringify)
    .process(markdown);

  return { html: String(file), headings };
}
