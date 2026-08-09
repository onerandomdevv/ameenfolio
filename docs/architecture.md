# Architecture

Ameenfolio is a Next.js 16 App Router application with two public pages and a single-owner admin.

## Request flow

- Public React Server Components query published rows through Drizzle and Neon’s pooled HTTP connection.
- `proxy.ts` refreshes/checks Neon Auth sessions for `/admin/:path*`; `/admin/login` remains public.
- Every admin layout, Server Action, upload signing call, and cleanup call independently invokes `requireAdmin`.
- `requireAdmin` checks the linked account list for GitHub provider account ID `231661599`; a Neon user ID alone is never accepted.
- Private R2 icons stream through `/media/[...key]`. Résumés stream only through `/resume` with an attachment disposition.
- `/api/wakatime/status` turns the owner’s server-only WakaTime data into a cached, privacy-safe payload containing coding/staleness state, today’s total, weekly total, daily average, top language, a seven-day breakdown, and timestamps. Project and branch names, raw heartbeat metadata, and the API key never reach the browser.
- A future `R2_PUBLIC_BASE_URL` changes icon delivery to a Cloudflare custom hostname while stored object keys remain unchanged.

## Data ownership

Neon Auth owns users and sessions in `neon_auth`. Application tables contain only portfolio content. `site_settings` is a database-enforced singleton. A PostgreSQL trigger prevents a ninth published homepage project, while Server Actions provide the same validation before writing.

## Cache invalidation

Public reads are server cached with the `portfolio` and `projects` tags. Successful mutations invalidate both public routes immediately. Database and R2 clients initialize lazily so imports and CI builds do not require runtime secrets.

## Source organization

```text
src/
├── app/                  Next.js routes, layouts, route handlers, and Server Actions
├── components/
│   ├── admin/            Admin-specific forms, navigation, and content managers
│   ├── layout/           Shared application-shell and status-page composition
│   ├── portfolio/        Public portfolio compositions
│   └── ui/               Registry-managed shadcn/ui primitives only
├── db/                   Drizzle schema, queries, seed, and database tests
└── lib/
    ├── auth/             Neon Auth session and owner-authorization boundary
    └── storage/          R2 client, upload rules, cleanup client, and tests
```

Route files coordinate requests and data. Reusable visual primitives live only in `components/ui` and stay aligned with the official shadcn registry. Application-specific components compose those primitives inside `admin`, `layout`, or `portfolio`; they do not reimplement buttons, fields, dialogs, alerts, cards, badges, tables, or empty states.

Shared infrastructure is grouped by responsibility under `lib`. Server-only modules identify themselves explicitly and are imported directly rather than through barrel files, which keeps client/server boundaries visible and avoids accidental bundle expansion.

## Maintenance checks

Prettier formats application-owned source while `src/components/ui` remains in its upstream registry format. CI runs `format:check`, lint, type-checking, unit/integration tests, the production build, and browser tests. Empty legacy directories and static portfolio media are intentionally absent; managed content assets belong in R2.
