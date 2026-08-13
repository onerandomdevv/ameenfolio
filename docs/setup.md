# Local and service setup

1. Copy `.env.example` to `.env.local` and replace every placeholder used by your environment.
2. In your own Neon account, create the `ameenfolio` project in the region closest to wherever you deploy. Keep the production branch and create a long-lived development branch. Use temporary branches to test migrations.
3. Put the pooled connection string in `DATABASE_URL` and the direct/unpooled string in `DATABASE_MIGRATION_URL`.
4. Provision Neon Auth, enable GitHub only, and configure its callback URL for local, preview, and production origins. Set a random cookie secret of at least 32 characters. Leave `ADMIN_GITHUB_USER_ID=231661599`.
5. Run `npm run db:migrate`, then `npm run db:seed`.
6. Create private `ameenfolio-media-dev` and `ameenfolio-media-prod` R2 buckets. Create narrowly scoped S3 API credentials per environment and apply `config/r2-cors.json` after replacing its placeholder origins.
7. Run `npm run dev` and open `/admin/login`.
8. Optional: install the WakaTime plugin in your editor and put the secret key from `https://wakatime.com/api-key` in `WAKATIME_API_KEY`. Bippy treats a heartbeat from the last five minutes as active coding.
9. Optional: create a project-scoped OpenAI API key and store it as the server-only `OPENAI_API_KEY` to enable Portfolio Copilot. See [portfolio-copilot.md](portfolio-copilot.md).

No Sanity data is migrated. Enter development content in the admin, then repeat against production before cutover.

## Migration workflow

Generate SQL with `npm run db:generate`. Create a temporary Neon branch from development, point `DATABASE_MIGRATION_URL` at it, and run `npm run db:migrate`. Test the application there before applying the same immutable migration to development and later production. Never use the pooled URL for Drizzle migration commands.

Before any migration containing `DROP TABLE`, `DROP COLUMN`, or another destructive statement, verify the exact Neon project and branch, record the affected row count, and export or snapshot the affected data. Applying a destructive migration requires explicit approval for that target after the preflight is recorded. Production additionally requires a tested restore point. Never use automatic confirmation flags for destructive changes.

## R2 rules

Icons accept PNG, JPEG, or WebP up to 2 MB. Résumés accept PDF up to 10 MB. SVG, HTML, scripts, archives, and executables are rejected. Presigned PUT URLs expire in five minutes and bind `Content-Type`. Configure an R2 lifecycle rule to remove unreferenced temporary objects after a conservative window as a final fallback for interrupted browser sessions.
