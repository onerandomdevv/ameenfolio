import { expect, test } from "@playwright/test";

test.skip(
  !process.env.NEON_AUTH_BASE_URL || !process.env.NEON_AUTH_COOKIE_SECRET,
  "Neon Auth credentials are required for protected-route E2E tests.",
);

test("unauthenticated admin requests are sent to owner login", async ({
  page,
}) => {
  await page.goto("/admin/now");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(
    page.getByRole("button", { name: /continue with github/i }),
  ).toBeVisible();
});

test("upload signing is unavailable without an admin session", async ({
  request,
}) => {
  const response = await request.post("/api/admin/uploads/sign", {
    data: {
      resourceType: "icon",
      filename: "test.png",
      contentType: "image/png",
      size: 100,
    },
    maxRedirects: 0,
  });
  expect([302, 303, 307, 401]).toContain(response.status());
});
