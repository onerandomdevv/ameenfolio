type PublicPostSource = {
  title: string;
  slug: string;
  bodyMarkdown: string;
  bodyHtml: string;
  headings: Array<{ id: string; text: string; level: number }>;
  publishedAt: Date;
  updatedAt: Date;
};

type PublicPostLinkSource = {
  label: string;
  url: string;
};

export type PublicArticle = ReturnType<typeof toPublicArticle>;

function absoluteUrl(baseUrl: string, path: string) {
  return new URL(path, `${baseUrl.replace(/\/$/, "")}/`).toString();
}

export function articleDescription(markdown: string, fallback: string) {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s{0,3}(?:#{1,6}|>|[-+*])\s+/gm, "")
    .replace(/[*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!plain) return fallback;
  if (plain.length <= 180) return plain;

  const shortened = plain.slice(0, 181);
  const boundary = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, boundary > 120 ? boundary : 180).trim()}…`;
}

export function toPublicArticle(
  post: PublicPostSource,
  links: PublicPostLinkSource[],
  baseUrl: string,
) {
  const url = absoluteUrl(baseUrl, `/writing/${post.slug}`);

  return {
    title: post.title,
    slug: post.slug,
    description: articleDescription(post.bodyMarkdown, post.title),
    bodyMarkdown: post.bodyMarkdown,
    bodyHtml: post.bodyHtml,
    headings: post.headings.map(({ id, text, level }) => ({ id, text, level })),
    publishedAt: post.publishedAt.toISOString(),
    modifiedAt: post.updatedAt.toISOString(),
    url,
    markdownUrl: `${url}.md`,
    links: links.map(({ label, url: linkUrl }) => ({
      label,
      url: linkUrl,
    })),
  };
}

export function toPublicArticleSummary(
  post: Pick<
    PublicPostSource,
    "title" | "slug" | "bodyMarkdown" | "publishedAt" | "updatedAt"
  >,
  baseUrl: string,
) {
  const url = absoluteUrl(baseUrl, `/writing/${post.slug}`);
  return {
    title: post.title,
    slug: post.slug,
    description: articleDescription(post.bodyMarkdown, post.title),
    publishedAt: post.publishedAt.toISOString(),
    modifiedAt: post.updatedAt.toISOString(),
    url,
    markdownUrl: `${url}.md`,
  };
}

function yamlString(value: string) {
  return JSON.stringify(value);
}

export function articleAsMarkdown(article: PublicArticle) {
  const links = article.links.length
    ? `\n\n## Related links\n\n${article.links
        .map((link) => `- [${link.label}](${link.url})`)
        .join("\n")}`
    : "";

  return [
    "---",
    `title: ${yamlString(article.title)}`,
    `description: ${yamlString(article.description)}`,
    `canonical: ${yamlString(article.url)}`,
    `date_published: ${yamlString(article.publishedAt)}`,
    `date_modified: ${yamlString(article.modifiedAt)}`,
    "---",
    "",
    `# ${article.title}`,
    "",
    article.bodyMarkdown.trim(),
    links,
    "",
  ].join("\n");
}

export function articleJsonLd(
  article: Pick<
    PublicArticle,
    "title" | "description" | "publishedAt" | "modifiedAt" | "url"
  >,
  author: { name: string; url: string },
) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.modifiedAt,
    mainEntityOfPage: article.url,
    url: article.url,
    author: {
      "@type": "Person",
      name: author.name,
      url: author.url,
    },
  };
}
