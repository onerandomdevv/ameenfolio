# Recognition Rows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace long-form recognition cards and uploaded icons with concise icon-first rows that are static without a link and fully clickable when an optional evidence link exists.

**Architecture:** A curated typed Lucide icon registry will be shared by the public server component and the admin client form while PostgreSQL stores only the stable icon name. The existing `title`, `verification_url`, ordering, and publication columns remain; obsolete issuer, description, date, and uploaded-icon columns are removed through a generated forward migration. A focused `RecognitionRow` component owns the conditional link semantics so the homepage stays simple.

**Tech Stack:** Next.js 16 App Router, React Server Components, TypeScript, shadcn/ui Select/Dialog/Card/Badge, Lucide React, React Hook Form, Zod, Drizzle ORM, Neon PostgreSQL, Vitest.

---

## Task 1: Lock the simplified recognition contract

**Files:**

- Create: `src/config/recognition-icons.ts`
- Modify: `src/lib/validation.test.ts`
- Modify: `src/lib/validation.ts`

- [ ] Add a failing validation test proving `{ title, iconName, verificationUrl?, displayOrder, published }` is accepted without issuer or description and that an unknown icon name is rejected.
- [ ] Run `npx vitest run src/lib/validation.test.ts` and confirm the new minimal recognition test fails against the old schema.
- [ ] Define the immutable icon registry with `trophy`, `award`, `medal`, `star`, `badge-check`, `crown`, and `sparkles`, each mapped to its Lucide component and an administrator-facing label.
- [ ] Export `recognitionIconNames` from the registry and change `recognitionSchema` to require `title` (2–180 characters), one allowed `iconName`, optional HTTPS `verificationUrl`, integer `displayOrder` (0–999), and `published`.
- [ ] Run the focused validation test and confirm it passes.
- [ ] Self-review that uploaded object keys, issuer, description, and date are absent from the recognition contract while project and Now icon validation remain unchanged.

## Task 2: Build and test the public recognition row

**Files:**

- Create: `src/components/portfolio/recognition-row.test.ts`
- Create: `src/components/portfolio/recognition-row.tsx`
- Modify: `src/app/page.tsx`

- [ ] Add a failing server-render test importing `RecognitionRow`; assert a linked recognition renders exactly one external anchor and arrow, while an unlinked recognition renders no anchor and no arrow.
- [ ] Run `npx vitest run src/components/portfolio/recognition-row.test.ts` and confirm it fails because the component does not exist.
- [ ] Implement a semantic row with the selected Lucide icon at the start, the recognition text as the flexible middle column, and an `ArrowUpRight` at the end only when `verificationUrl` exists. Linked rows use a full-row external anchor; static rows use a non-interactive `div`.
- [ ] Replace the homepage recognition cards with a `ul` of `RecognitionRow` components separated by subtle borders and remove now-unused card, asset, and verification-button imports.
- [ ] Run the focused row test and confirm it passes.
- [ ] Self-review keyboard focus, minimum row height, mobile wrapping, non-link hover behavior, and `aria-hidden` decorative icons.

## Task 3: Simplify recognition administration

**Files:**

- Add: `src/components/ui/select.tsx` through `npx shadcn@latest add select`
- Modify: `src/components/admin/recognitions-manager.tsx`
- Modify: `src/app/admin/actions/recognitions.ts`
- Modify: `src/app/admin/(protected)/recognitions/page.tsx`

- [ ] Install and inspect the official shadcn Select component without overwriting unrelated UI files.
- [ ] Replace issuer, description, date, upload, and alt-text controls with a required Recognition text input, a controlled shadcn icon Select showing Lucide previews, optional evidence-link input, display order, and published switch.
- [ ] Update admin list cards to show the selected icon, recognition text, optional linked badge, and published state.
- [ ] Remove upload cleanup and R2 object assertions from recognition save/delete actions; mutations store only validated recognition fields and still refresh public content.
- [ ] Update admin page copy to explain concise recognition rows and optional supporting links.
- [ ] Run targeted ESLint on the admin files and search for obsolete recognition upload references.
- [ ] Self-review dialog labels, error messages, delete copy, and form defaults for create/edit consistency.

## Task 4: Migrate the recognition table forward

**Files:**

- Modify: `src/db/schema.ts`
- Modify: `src/db/schema.integration.test.ts`
- Create: `drizzle/0006_*.sql` and `drizzle/meta/0006_snapshot.json` through Drizzle generation
- Modify: `drizzle/meta/_journal.json` through Drizzle generation

- [ ] Query the connected Neon database read-only for the current recognition row count before changing the table.
- [ ] Change the active `recognitions` table to `title`, `iconName` defaulting to `trophy`, optional `verificationUrl`, `displayOrder`, `published`, and timestamps; retain the public ordering index.
- [ ] Extend the schema test to assert `iconName` exists and obsolete long-form/icon-upload properties do not.
- [ ] Run the schema test before generation and confirm the active model assertions pass.
- [ ] Run `npm run db:generate`; inspect the generated SQL and verify it only adds `icon_name` and drops the five obsolete columns/check constraint from `recognitions`.
- [ ] Run `npm run db:migrate`, query `information_schema.columns`, and verify the live column set plus the recorded migration hash.
- [ ] Run the focused schema test again.
- [ ] Self-review the snapshot for unrelated schema changes and keep every historical migration unchanged.

## Task 5: Focused verification

**Files:**

- Verify all files changed above.

- [ ] Run `npx vitest run src/lib/validation.test.ts src/components/portfolio/recognition-row.test.ts src/db/schema.integration.test.ts`.
- [ ] Run ESLint only on the changed recognition, schema, validation, and homepage files.
- [ ] Run `git diff --check` on the feature files and search for `recognition.iconKey`, `recognition.issuer`, `recognition.description`, `recognizedOn`, `UploadField`, and recognition object deletion paths.
- [ ] Confirm the homepage dev route compiles and the admin recognition route remains protected.
- [ ] Do not run the full build, full lint, formatting check, or complete test suite until the broader redesign is ready, per the user's instruction.
