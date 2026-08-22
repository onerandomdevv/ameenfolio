import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The section renders whether or not anything is published, so this holds with
// or without a database — the same reasoning as the stats strip.
test("the homepage always offers the writing section", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Writing" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /all writing/i }),
  ).toHaveAttribute("href", "/writing");
});

test("the writing index is reachable and accessible", async ({ page }) => {
  await page.goto("/writing");
  await expect(
    page.getByRole("heading", { level: 1, name: "Writing" }),
  ).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test("a post renders its body, date and contents", async ({ page }) => {
  test.skip(
    !process.env.DATABASE_URL,
    "Posts are content, not configuration: without a database there are none.",
  );

  await page.goto("/writing");
  const firstPost = page.locator('a[href^="/writing/"]').first();
  const postCount = await page.locator('a[href^="/writing/"]').count();
  test.skip(postCount === 0, "No posts published in this environment.");

  const firstPostHref = await firstPost.getAttribute("href");
  expect(firstPostHref).toMatch(/^\/writing\//);
  await page.goto(firstPostHref!);
  await expect(page.locator("article.post-body")).toBeVisible();
  // A real <time>, so the date is machine-readable rather than just printed.
  await expect(page.locator("time").first()).toHaveAttribute(
    "datetime",
    /^\d{4}-\d{2}-\d{2}$/,
  );

  // Every contents entry must point at a heading that exists, which is the
  // thing that breaks if the ids are collected before sanitising rewrites them.
  const anchors = await page
    .locator('nav[aria-label="On this page"] a')
    .evaluateAll((links) =>
      links.map((link) => link.getAttribute("href") ?? ""),
    );
  for (const anchor of anchors) {
    await expect(page.locator(anchor)).toHaveCount(1);
  }

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("published writing is readable over plain HTTP without JavaScript", async ({
  request,
}) => {
  test.skip(
    !process.env.DATABASE_URL,
    "A database is required to verify a real published article.",
  );

  const listResponse = await request.get("/api/public/writing");
  expect(listResponse.status()).toBe(200);
  const list = (await listResponse.json()) as {
    articles: Array<{ title: string; slug: string }>;
  };
  test.skip(
    list.articles.length === 0,
    "No posts published in this environment.",
  );

  const selected = list.articles[0];
  const detailResponse = await request.get(
    `/api/public/writing/${selected.slug}`,
  );
  expect(detailResponse.status()).toBe(200);
  const detail = (await detailResponse.json()) as {
    title: string;
    bodyMarkdown: string;
    bodyHtml: string;
    publishedAt: string;
    modifiedAt: string;
    url: string;
  };
  const bodyWords =
    detail.bodyMarkdown.match(/[A-Za-z]{8,}/g)?.slice(0, 3) ?? [];
  expect(bodyWords.length).toBeGreaterThan(0);

  const userAgents = [
    "curl/8.0",
    "OAI-SearchBot/1.0; +https://openai.com/searchbot",
    "Claude-SearchBot/1.0",
    "Claude-User/1.0",
  ];
  for (const userAgent of userAgents) {
    const response = await request.get(`/writing/${selected.slug}`, {
      headers: { "User-Agent": userAgent },
    });
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain("<article");
    expect(html).toContain(detail.title);
    expect(html).toContain("application/ld+json");
    expect(html).toContain("text/markdown");
    expect(html).toContain(`/writing/${selected.slug}.md`);
    for (const word of bodyWords) expect(html).toContain(word);

    const jsonLdSource = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
    )?.[1];
    expect(jsonLdSource).toBeTruthy();
    const jsonLd = JSON.parse(jsonLdSource ?? "{}") as Record<string, unknown>;
    expect(jsonLd).toMatchObject({
      "@type": "Article",
      headline: detail.title,
      mainEntityOfPage: detail.url,
      datePublished: detail.publishedAt,
      dateModified: detail.modifiedAt,
    });
  }

  const markdownResponse = await request.get(`/writing/${selected.slug}.md`);
  expect(markdownResponse.status()).toBe(200);
  expect(markdownResponse.headers()["content-type"]).toContain("text/markdown");
  const markdown = await markdownResponse.text();
  expect(markdown).toContain(`# ${detail.title}`);
  for (const word of bodyWords) expect(markdown).toContain(word);
});

test("discovery surfaces enumerate only published canonical pages", async ({
  request,
}) => {
  test.skip(
    !process.env.DATABASE_URL,
    "A database is required to compare discovery output with published rows.",
  );

  const listResponse = await request.get("/api/public/writing");
  expect(listResponse.status()).toBe(200);
  const list = (await listResponse.json()) as {
    articles: Array<{ url: string; markdownUrl: string }>;
  };

  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.status()).toBe(200);
  const sitemap = await sitemapResponse.text();
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => match[1],
  );
  expect(new Set(locations)).toEqual(
    new Set([
      "https://onerandomdev.cv",
      "https://onerandomdev.cv/projects",
      "https://onerandomdev.cv/writing",
      ...list.articles.map((article) => article.url),
    ]),
  );
  expect(sitemap).not.toMatch(/\/admin|\/api\/|\.md<\/loc>/);

  const llmsResponse = await request.get("/llms.txt");
  expect(llmsResponse.status()).toBe(200);
  const llms = await llmsResponse.text();
  for (const article of list.articles) {
    expect(llms).toContain(article.markdownUrl);
  }
  expect(llms).not.toMatch(/\]\([^)]*(?:\/admin|\/mcp|private-media)/i);

  const missing = "definitely-not-a-published-article";
  expect((await request.get(`/api/public/writing/${missing}`)).status()).toBe(
    404,
  );
  expect((await request.get(`/writing/${missing}.md`)).status()).toBe(404);
});

test("robots separates retrieval crawlers from training crawlers", async ({
  request,
}) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  const robots = await response.text();

  for (const crawler of [
    "OAI-SearchBot",
    "ChatGPT-User",
    "Claude-SearchBot",
    "Claude-User",
  ]) {
    expect(robots).toContain(`User-Agent: ${crawler}`);
  }
  for (const crawler of ["GPTBot", "ClaudeBot"]) {
    expect(robots).toContain(`User-Agent: ${crawler}`);
  }
  expect(robots).toMatch(
    /User-Agent: GPTBot\s+User-Agent: ClaudeBot\s+Disallow: \//i,
  );
  expect(robots).toContain("Allow: /api/public/");
  expect(robots).toContain("Disallow: /admin");
});

test("the admin hostname exposes no discovery surfaces", async ({
  request,
}) => {
  const headers = { Host: "admin.localhost:3000" };

  const robots = await request.get("/robots.txt", { headers });
  expect(robots.status()).toBe(200);
  expect(robots.headers()["content-type"]).toContain("text/plain");
  expect(await robots.text()).toBe("User-agent: *\nDisallow: /\n");

  for (const path of ["/sitemap.xml", "/llms.txt"]) {
    const response = await request.get(path, { headers });
    expect(response.status()).toBe(404);
    expect(response.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  }

  const publicRobots = await request.get("/robots.txt");
  expect(publicRobots.status()).toBe(200);
  expect(await publicRobots.text()).toContain("User-Agent: OAI-SearchBot");
});
