# Deployment checklist

The project is a stock Next.js app with no custom `output` mode and no platform-specific configuration, so it runs anywhere that provides a Node.js 22 runtime, `npm ci`, `npm run build`, and `npm start`.

Keep it that way. Nothing in the repository should assume a particular host.

## Environment

Set every value from `.env.example` as a server-side secret. Only `NEXT_PUBLIC_APP_URL` is exposed to the browser.

**Replace the placeholders.** Pasting the template verbatim is how `NEON_AUTH_BASE_URL` once shipped as `ep-example.neonauth.region.aws.neon.tech`, a hostname that resolves nowhere. Every `/api/auth/*` request failed while the app still looked correctly configured from the outside, because the code only checks that the variable is non-empty.

`NEXT_PUBLIC_APP_URL` and `CANONICAL_SITE_URL` must be the exact origin serving the deployment, or canonical URLs, the sitemap, and OAuth redirects point at the wrong host.

Use the development Neon branch and `ameenfolio-media-dev` for previews. Production uses the production Neon branch and `ameenfolio-media-prod`.

## Admin host

The admin app is served only from a host whose first label is `admin.` — matched on the subdomain label, not a full domain, so it works under whatever domain you deploy. Point both the apex and `admin.<domain>` at the same deployment; no second project is needed.

On the admin host the `/admin` route prefix is an implementation detail and is not a URL:

| Request | Serves |
| --- | --- |
| `admin.<domain>/` | admin projects list |
| `admin.<domain>/settings` | admin settings |
| `admin.<domain>/login` | owner sign-in |
| `admin.<domain>/admin/...` | 404 |
| `<domain>/admin/...` | 404 |

This means the session cookie is scoped to the admin host and is never sent to the public site, and the admin can be put behind network-level controls without touching the portfolio.

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
- Sign in through GitHub as `onerandomdevv` and verify another account receives 403.
- Populate required production content.
- Verify icon upload and replacement, résumé download, CRUD, sign-out, `/`, and `/projects`.
- Confirm security headers and canonical/robots/sitemap URLs.
- Retain the prior deployment and a database restore point for rollback.

## Required checks

After the GitHub Actions `quality` workflow is green, add both `quality / quality` and `quality / e2e` as required checks on the protected `dev` and `main` rulesets.
