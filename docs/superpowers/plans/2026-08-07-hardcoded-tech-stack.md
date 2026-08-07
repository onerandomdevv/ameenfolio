# Hardcoded Tech Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the database- and admin-managed technologies feature with the approved, server-rendered hardcoded Tech Stack chips and remove the obsolete technologies table through a forward migration.

**Architecture:** A typed immutable config will be the sole source of Tech Stack content. A focused React Server Component will render that data with the existing shadcn `Badge`, and the homepage will compose the section without querying PostgreSQL. The admin route, actions, validation, queries, schema model, and R2 technology references will be deleted; Drizzle will generate a new migration that drops only the obsolete table.

**Tech Stack:** Next.js 16 App Router, React Server Components, TypeScript, Tailwind CSS 4, shadcn/ui Badge, Drizzle ORM, Neon PostgreSQL, Vitest, Playwright.

---

## Task 1: Define and lock the hardcoded stack

**Files:**

- Create: `src/config/tech-stack.test.ts`
- Create: `src/config/tech-stack.ts`

- [ ] Write a failing Vitest test that imports `techStackGroups` and asserts the exact two group names, exact technology names, display labels, abbreviations, and declared ordering from the approved design specification.
- [ ] Run `npx vitest run src/config/tech-stack.test.ts` and confirm it fails because the config does not exist.
- [ ] Implement readonly `TechStackGroup` and `TechStackItem` types plus the immutable `techStackGroups` array. Each item must have a stable id, display name, abbreviation, background colour, and foreground colour.
- [ ] Run `npx vitest run src/config/tech-stack.test.ts` and confirm it passes.
- [ ] Self-review: confirm JavaScript and GCP remain included, Auth.js and the other explicit exclusions are absent, and colours provide readable foreground/background contrast.

## Task 2: Build the public Tech Stack section

**Files:**

- Create: `src/components/portfolio/tech-stack-section.tsx`
- Modify: `src/app/page.tsx`
- Modify: `tests/e2e/public.spec.ts`

- [ ] Add a focused Playwright assertion for the `Tech Stack`, `Core Stack`, and `Tools & Infrastructure` headings and the configured chips on the homepage.
- [ ] Run the focused Playwright test before the component change and confirm it fails on the missing group/content presentation.
- [ ] Review the installed official shadcn Badge documentation with `npx shadcn@latest docs badge` before modifying the UI.
- [ ] Implement `TechStackSection` as a server component using semantic `section`, group headings, and lists. Render every item as a non-interactive shadcn `Badge` with a decorative coloured abbreviation box and neutral name text.
- [ ] Replace the inline database-driven homepage block with `<TechStackSection />`; remove `Object.groupBy`, the dynamic empty state, database technology destructuring, and now-unused imports.
- [ ] Run the focused Playwright assertion and verify all chips render in declared order.
- [ ] Self-review: verify the section is left-aligned, uses the established lime heading, wraps without horizontal scrolling, and introduces no client component or new icon/logo dependency.

## Task 3: Remove technology administration and runtime data paths

**Files:**

- Delete: `src/app/admin/(protected)/technologies/page.tsx`
- Delete: `src/app/admin/actions/technologies.ts`
- Delete: `src/components/admin/technologies-manager.tsx`
- Modify: `src/components/admin/admin-nav.tsx`
- Modify: `src/lib/validation.ts`
- Modify: `src/db/queries.ts`

- [ ] Add or update a focused test/assertion proving the admin navigation no longer exposes `Technologies`.
- [ ] Remove the Technologies navigation entry and its unused Lucide import.
- [ ] Delete the protected route, manager component, and Server Actions.
- [ ] Remove `technologySchema` and `TechnologyInput` from validation.
- [ ] Remove the technologies import, public select/return value, admin query, and technology icon branch from `isReferencedPublicMedia`.
- [ ] Bump the public portfolio cache key because its returned shape changes.
- [ ] Run `rg -n --glob '!drizzle/**' "admin/technologies|technologySchema|getAdminTechnologies|TechnologyInput|crud\.technology" src tests` and confirm no obsolete runtime references remain.
- [ ] Self-review: confirm projects, recognitions, Now links, profile images, and résumé storage paths are unchanged.

## Task 4: Remove the active Drizzle model and migrate Neon forward

**Files:**

- Modify: `src/db/schema.ts`
- Modify: `src/db/schema.integration.test.ts`
- Create: `drizzle/0005_*.sql` (generated name)
- Modify: `drizzle/meta/_journal.json` (generated)
- Create/Modify: `drizzle/meta/0005_snapshot.json` (generated)

- [ ] Query the connected database read-only and record the existing technologies row count before removal.
- [ ] Update the schema integration expectation so `technologies` is not among active application tables.
- [ ] Remove the `technologies` table declaration, `Technology` type export, and any now-unused schema imports.
- [ ] Run `npm run db:generate` to generate a forward migration; do not edit historical migrations.
- [ ] Inspect the generated migration and confirm its only schema-destructive operation is `DROP TABLE "technologies"`.
- [ ] Run `npm run db:migrate` against the configured Neon database.
- [ ] Query `information_schema.tables` and confirm the public `technologies` table no longer exists.
- [ ] Run the focused schema test with `npx vitest run src/db/schema.integration.test.ts` (using `TEST_DATABASE_URL` when configured).
- [ ] Self-review: compare the active Drizzle schema and generated snapshot for type consistency and confirm no unrelated table, index, or trigger changed.

## Task 5: Focused verification and redesign handoff

**Files:**

- Verify all files changed above.

- [ ] Run focused unit tests: `npx vitest run src/config/tech-stack.test.ts src/db/schema.integration.test.ts`.
- [ ] Run ESLint only on the changed TypeScript/TSX feature files.
- [ ] Run the focused homepage Playwright test at the mobile 390px project/viewport.
- [ ] Inspect the homepage at 360px and 390px, confirming chip wrapping and `document.documentElement.scrollWidth <= document.documentElement.clientWidth`.
- [ ] Inspect `/admin` navigation and `/admin/technologies`, confirming the link is absent and the deleted route resolves as not found for an authorized admin.
- [ ] Run a final repository search for the obsolete technology administration and database identifiers while allowing the historical create migration and new drop migration.
- [ ] Review the approved design specification line by line and mark all in-scope requirements covered.
- [ ] Do not run the full build, full lint, formatting check, or complete test suite until the broader redesign is ready, per the user's instruction.
