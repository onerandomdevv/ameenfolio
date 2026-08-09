import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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

test("homepage renders the Tech Stack groups", async ({ page }) => {
  // The list is database content now, and an empty group renders nothing at
  // all, so without a database there is no section to assert against. Gated
  // the same way the admin specs gate on their Neon Auth credentials.
  test.skip(
    !process.env.DATABASE_URL,
    "A database is required: the Tech Stack is content, not configuration.",
  );
  await page.goto("/");

  const section = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Tech Stack" }),
  });

  // Scoped per group. Counting listitems across the whole section would pass
  // with one group holding everything and the other rendering empty.
  for (const name of ["Core Stack", "Tools & Infrastructure"]) {
    const heading = section.getByRole("heading", { name, exact: true });
    await expect(heading).toBeVisible();
    const group = heading.locator("..");
    expect(await group.getByRole("listitem").count()).toBeGreaterThan(0);
  }

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

  // The résumé is one of the two closing calls to action, not footer fine
  // print, so it is asserted inside the contact section rather than <footer>.
  const contact = page.locator("section[aria-labelledby=contact-heading]");
  await expect(
    contact.getByRole("heading", { name: "Open to a nice conversation" }),
  ).toBeVisible();
  // A dialog trigger, not a mailto link: it offers a choice of channel rather
  // than committing the visitor to email before they have picked one.
  await contact.getByRole("button", { name: "Send a message" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("link", { name: /Email/ })).toHaveAttribute(
    "href",
    /^mailto:/,
  );
  await page.keyboard.press("Escape");
  // A button, not a link: the résumé is fetched and downloaded in place rather
  // than navigated to, so there is deliberately no href to follow.
  await expect(
    contact.getByRole("button", { name: "View Resume" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "View Resume" })).toHaveCount(0);
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
