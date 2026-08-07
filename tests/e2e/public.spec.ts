import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("homepage is mobile-first and accessible", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Ameen" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Recent projects" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /view all projects/i }),
  ).toHaveAttribute("href", "/projects");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("projects archive has no internal detail links", async ({ page }) => {
  await page.goto("/projects");
  await expect(
    page.getByRole("heading", { level: 1, name: "All projects" }),
  ).toBeVisible();
  const internalDetailLinks = page.locator('a[href^="/projects/"]');
  await expect(internalDetailLinks).toHaveCount(0);
});
