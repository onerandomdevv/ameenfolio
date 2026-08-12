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

test("live coding keeps Bippy glowing and reveals details only when tapped", async ({
  page,
}) => {
  await page.route("**/api/wakatime/status", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        isCoding: true,
        statsStale: false,
        todayDate: "2026-08-10",
        todayText: "2 hrs 15 mins",
        todaySeconds: 8_100,
        weekSeconds: 18_000,
        dailyAverageSeconds: 9_000,
        topLanguage: { name: "TypeScript", percent: 72 },
        days: [],
        lastActiveAt: "2026-08-10T02:00:00.000Z",
        checkedAt: "2026-08-10T02:00:00.000Z",
      }),
    });
  });
  await page.goto("/");

  const companion = page.getByTestId("bippy-companion");
  const companionAvailable = await companion
    .waitFor({ state: "visible", timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
  test.skip(
    !companionAvailable,
    "Public Bippy is disabled in this environment.",
  );
  await expect(companion).toHaveAttribute("data-coding", "true");
  await expect(page.getByTestId("bippy-message")).toHaveCount(0);

  const glow = await companion.evaluate((element) => ({
    halo: getComputedStyle(element, "::before").content,
    outline: getComputedStyle(element.firstElementChild as Element).filter,
  }));
  expect(glow.halo).not.toBe("none");
  expect(glow.outline).not.toBe("none");

  await page.getByTestId("bippy").click();
  await expect(page.getByTestId("bippy-message")).toContainText(
    "Ameen is coding right now.",
  );
  await expect(page.getByTestId("bippy-message")).toContainText(
    "2 hrs 15 mins today",
  );
  await expect(page.getByTestId("bippy-message")).toHaveCount(0, {
    timeout: 7_000,
  });

  await page.getByTestId("bippy").click();
  await expect(page.getByTestId("bippy-message")).toBeVisible();
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

  // Each group is a row that opens its own list, so the assertion opens them.
  // Still scoped per group: counting across both would pass with one holding
  // everything and the other empty.
  for (const name of ["Core Stack", "Tools & Infrastructure"]) {
    const row = section.getByRole("button", { name, exact: true });
    await expect(row).toBeVisible();

    // Nothing is listed until it is opened — that is the point of the redesign.
    await row.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    expect(await dialog.getByRole("listitem").count()).toBeGreaterThan(0);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
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
  const contact = page.locator("#contact");
  // One sentence, not a heading over a button row: both actions sit in the
  // running text, so the whole invitation reads as a single line.
  await expect(contact.locator("p")).toHaveText(
    /Open to a nice conversation, send a message or view resume\./,
  );
  // A dialog trigger, not a mailto link: it offers a choice of channel rather
  // than committing the visitor to email before they have picked one.
  await contact.getByRole("button", { name: "send a message" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("link", { name: /Email/ })).toHaveAttribute(
    "href",
    /^mailto:/,
  );
  await page.keyboard.press("Escape");
  // A button, not a link: the résumé is fetched and downloaded in place rather
  // than navigated to, so there is deliberately no href to follow.
  await expect(
    contact.getByRole("button", { name: "view resume" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /view resume/i })).toHaveCount(0);
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
