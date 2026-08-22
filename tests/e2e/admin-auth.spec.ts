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

// The path mount is the way back in when no `admin.` host can exist — a
// platform fallback URL has no subdomain to point at the deployment.
test("the path-mounted admin stays reachable off the admin host", async ({
  request,
}) => {
  const guarded = await request.get("/admin/now", { maxRedirects: 0 });
  expect([302, 303, 307]).toContain(guarded.status());
  expect(guarded.headers()["location"]).toContain("/admin/login");

  const login = await request.get("/admin/login");
  expect(login.status()).toBe(200);
  expect(await login.text()).toContain("Continue with GitHub");
});

// On the admin host the prefix is a detail of the route tree, not an address.
test("the admin host does not double-mount under /admin", async ({
  request,
}) => {
  const response = await request.get("/admin/login", {
    headers: { Host: ADMIN_HOST },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(404);
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
  const html = await response.text();
  expect(html).toContain("Continue with GitHub");
  const robotsMeta = html.match(/<meta[^>]+name="robots"[^>]*>/i)?.[0];
  expect(robotsMeta).toContain("noindex");
  expect(robotsMeta).toContain("nofollow");
  expect(robotsMeta).toContain("noarchive");
  expect(robotsMeta).toContain("nosnippet");
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
