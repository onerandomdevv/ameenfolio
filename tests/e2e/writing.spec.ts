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

  await firstPost.click();
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
