# Architecture

Ameenfolio is a Next.js 16 App Router application with two public pages and a single-owner admin.

## Request flow

- Public React Server Components query published rows through Drizzle and Neon’s pooled HTTP connection.
- `proxy.ts` refreshes/checks Neon Auth sessions for `/admin/:path*`; `/admin/login` remains public.
- Every admin layout, Server Action, upload signing call, and cleanup call independently invokes `requireAdmin`.
- `requireAdmin` checks the linked account list for GitHub provider account ID `231661599`; a Neon user ID alone is never accepted.
- Private R2 icons stream through `/media/[...key]`. Résumés stream only through `/resume` with an attachment disposition.
- A future `R2_PUBLIC_BASE_URL` changes icon delivery to a Cloudflare custom hostname while stored object keys remain unchanged.

## Data ownership

Neon Auth owns users and sessions in `neon_auth`. Application tables contain only portfolio content. `site_settings` is a database-enforced singleton. A PostgreSQL trigger prevents a ninth published homepage project, while Server Actions provide the same validation before writing.

## Cache invalidation

Public reads are server cached with the `portfolio` and `projects` tags. Successful mutations invalidate both public routes immediately. Database and R2 clients initialize lazily so imports and CI builds do not require runtime secrets.
