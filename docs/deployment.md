# Deployment checklist

The project is a stock Next.js app with no custom `output` mode and no platform-specific configuration, so it runs anywhere that provides a Node.js 22 runtime, `npm ci`, `npm run build`, and `npm start`.

Keep it that way. Nothing in the repository should assume a particular host.

## Environment

Set every value from `.env.example` as a server-side secret. Only `NEXT_PUBLIC_APP_URL` is exposed to the browser.

**Replace the placeholders.** Pasting the template verbatim is how `NEON_AUTH_BASE_URL` once shipped as `ep-example.neonauth.region.aws.neon.tech`, a hostname that resolves nowhere. Every `/api/auth/*` request failed while the app still looked correctly configured from the outside, because the code only checks that the variable is non-empty.

`NEXT_PUBLIC_APP_URL` and `CANONICAL_SITE_URL` must be the exact origin serving the deployment, or canonical URLs, the sitemap, and OAuth redirects point at the wrong host.

Use the development Neon branch and `ameenfolio-media-dev` for previews. Production uses the production Neon branch and `ameenfolio-media-prod`.

`WAKATIME_API_KEY` is optional. When configured, keep it server-only; the public application receives only a cached, privacy-safe coding status, today and weekly totals, daily average, top language, seven-day breakdown, and timestamps. Project and branch names are excluded. Without the key, Bippy retains his normal idle behavior and the projects-page activity strip renders offline with empty totals.

## Admin host

The admin app has two mountings, both always live. A host whose first label is `admin.` serves it at the root — matched on the subdomain label, not a full domain, so it works under whatever domain you deploy. Every other host serves it under `/admin`. Point both the apex and `admin.<domain>` at the same deployment; no second project is needed.

The subdomain is the intended route. On it, the `/admin` route prefix is an implementation detail and is not a URL:

| Request                    | Serves                    |
| -------------------------- | ------------------------- |
| `admin.<domain>/`          | admin projects list       |
| `admin.<domain>/settings`  | admin settings            |
| `admin.<domain>/login`     | owner sign-in             |
| `admin.<domain>/admin/...` | 404                       |
| `<domain>/admin/settings`  | admin settings (fallback) |

Used through the subdomain, the session cookie is scoped to that host and never sent to the public site, and the admin can be put behind network-level controls without touching the portfolio.

The `/admin` path mount is kept as a fallback rather than blocked. A platform-assigned URL has no `admin.` sibling to point anywhere, so if DNS lapses or the domain expires, the path mount is the only remaining way in. Blocking it would make the admin unreachable at exactly the moment it is needed to fix things.

Links resolve per request from the `Host` header, so the same page links correctly under either mounting. Nothing needs configuring for this; no environment variable names the admin host.

Register `https://admin.<domain>` as its own origin everywhere in the next section — the GitHub OAuth callback and R2 CORS both need it, and the apex entry does not cover it.

## Origins registered outside the host

Adding a domain to your hosting platform is not enough. The same exact origin must also be allowed in:

- **Neon Auth** — trusted origins and the GitHub OAuth callback URL.
- **R2 bucket CORS** — see `config/r2-cors.json`. Uploads are a browser `PUT` straight to R2, so a missing origin surfaces as an opaque `Failed to fetch` in the admin with nothing useful logged server-side.

Add both the preview and production origins.

## Before production traffic switches

- Inspect pending SQL. For destructive statements, verify the exact project and branch, record affected row counts, export removed values and storage-key manifests, create and test a restore point, and obtain explicit approval before applying.
- After a destructive migration succeeds and its export is verified, delete only storage objects proven unreferenced, and retain a cleanup-failure log for retry.
- Apply approved migrations and seed the settings and Now-section singletons.
- Apply them **before** the build that needs them goes live. Drizzle selects every column its model declares, so a release that adds one starts asking for it on the very first request. When that column is on `site_settings`, the homepage cannot render without it and the whole public site returns an error page until the migration lands — not just the feature that added the column.
- Sign in through GitHub as `onerandomdevv` and verify another account receives 403.
- Populate required production content.
- Verify icon upload and replacement, résumé download, CRUD, sign-out, `/`, and `/projects`.
- Confirm security headers and canonical/robots/sitemap URLs.
- Retain the prior deployment and a database restore point for rollback.

## Required checks

After the GitHub Actions `quality` workflow is green, add both `quality / quality` and `quality / e2e` as required checks on the protected `dev` and `main` rulesets.
