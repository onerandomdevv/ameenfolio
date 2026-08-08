import { expect, test } from "@playwright/test";

test.skip(
  !process.env.NEON_AUTH_BASE_URL || !process.env.NEON_AUTH_COOKIE_SECRET,
  "Neon Auth credentials are required for protected-route E2E tests.",
);

// The admin app is served only from a host beginning with `admin.`, so requests
// are distinguished by Host rather than by path. 127.0.0.1 cannot carry a
// subdomain label, so the admin host is asserted through a header override
// rather than by navigating to it.
const ADMIN_HOST = "admin.localhost:3000";

test("the public host does not serve the admin app", async ({ request }) => {
  for (const path of ["/admin", "/admin/now", "/admin/login"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), `${path} should not exist publicly`).toBe(404);
  }
});

test("unauthenticated admin requests are sent to owner login", async ({
  request,
}) => {
  const response = await request.get("/now", {
    headers: { Host: ADMIN_HOST },
    maxRedirects: 0,
  });

  expect([302, 303, 307]).toContain(response.status());
  expect(response.headers()["location"]).toContain("/login");
});

test("the admin login page renders on the admin host", async ({ request }) => {
  const response = await request.get("/login", {
    headers: { Host: ADMIN_HOST },
  });

  expect(response.status()).toBe(200);
  expect(await response.text()).toContain("Continue with GitHub");
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
