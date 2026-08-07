# PXXL deployment checklist

PXXL must provide a Node.js 22 runtime, `npm ci`, `npm run build`, and `npm start`. Configure all values from `.env.example` as server-side secrets except `NEXT_PUBLIC_APP_URL`.

Use the development Neon branch and `ameenfolio-media-dev` for preview deployments. Production must use the production Neon branch and `ameenfolio-media-prod`. Add both exact origins to Neon Auth and R2 CORS. Do not expose database, auth cookie, or R2 credentials to the browser.

Before production traffic switches:

- inspect pending SQL; for destructive statements, verify the exact project and branch, record affected row counts, export removed values and storage-key manifests, create and test a restore point, and obtain explicit approval before applying;
- after a destructive migration succeeds and its export is verified, delete only storage objects proven unreferenced and retain a cleanup-failure log for retry;
- apply approved migrations and seed the settings and Now-section singletons;
- sign in through GitHub as `onerandomdevv` and verify another account receives 403;
- populate required production content;
- verify icon upload/replacement, résumé download, CRUD, sign-out, `/`, and `/projects`;
- confirm security headers and canonical/robots/sitemap URLs;
- retain the prior PXXL deployment and database restore point for rollback.

After the GitHub Actions `quality` workflow is green, add both `quality / quality` and `quality / e2e` as required checks on the protected `dev` and `main` rulesets.
