import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { techStackGroups, type TechStackItem } from "@/config/tech-stack";

test("homepage is mobile-first and accessible", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Aliameen Kareem" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Recent Projects" }),
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

test("homepage keeps the fixed Now heading without published copy", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Now" })).toBeVisible();
});

test("homepage renders the fixed Tech Stack groups", async ({ page }) => {
  await page.goto("/");

  const section = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Tech Stack" }),
  });
  await expect(
    section.getByRole("heading", { name: "Core Stack" }),
  ).toBeVisible();
  await expect(
    section.getByRole("heading", { name: "Tools & Infrastructure" }),
  ).toBeVisible();
  const technologies = techStackGroups.reduce<TechStackItem[]>(
    (items, group) => [...items, ...group.items],
    [],
  );
  const chips = section.getByRole("listitem");
  await expect(chips).toHaveCount(technologies.length);
  for (const [index, technology] of technologies.entries()) {
    await expect(chips.nth(index)).toContainText(technology.name);
  }
  await expect(section.getByText("Auth.js", { exact: true })).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test("intro contact links do not include Instagram", async ({ page }) => {
  await page.goto("/");
  const contactLinks = page.getByRole("navigation", { name: "Contact links" });
  await expect(
    contactLinks.getByText("Instagram", { exact: true }),
  ).toHaveCount(0);
});

test("resume is not presented as a standalone homepage section", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "View Resume" })).toHaveCount(
    0,
  );
  await expect(page.getByRole("link", { name: "Email me" })).toHaveCount(0);
  await expect(
    page.locator("footer").getByRole("link", { name: "View Resume" }),
  ).toBeVisible();
});

test("projects archive has no internal detail links", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByRole("link", { name: "Projects" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  const internalDetailLinks = page.locator('a[href^="/projects/"]');
  await expect(internalDetailLinks).toHaveCount(0);
});
