# Now Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a compact, administrator-managed Now section between the homepage hero and Recent Projects.

**Architecture:** Store the singleton section settings and repeatable links in separate PostgreSQL tables. Public data remains server-rendered and cached; protected Server Actions update section timestamps atomically with link mutations using Neon HTTP batches. Existing R2 icon upload, shadcn admin, authorization, and cache invalidation patterns are reused.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Drizzle ORM, Neon PostgreSQL, Zod, React Hook Form, shadcn/ui, Lucide React, Cloudflare R2, Vitest.

---

## Task 1: Validation and limit behavior

**Files:**

- Modify: `src/lib/validation.ts`
- Modify: `src/lib/validation.test.ts`
- Modify: `src/lib/ordering.ts`
- Modify: `src/lib/ordering.test.ts`

- [ ] **Step 1: Write failing validation and link-limit tests**

Add tests that accept any trimmed non-empty description, reject descriptions longer than 600 characters, reject HTTP link URLs, require alt text when an icon key exists, and reject a seventh link through `canAddNowLink(6)`.

```ts
expect(
  nowSectionSchema.safeParse({
    description: "Building useful tools.",
    published: true,
    showLastUpdated: true,
  }).success,
).toBe(true);

expect(
  nowLinkSchema.safeParse({
    label: "Current product",
    url: "http://example.com",
    displayOrder: 0,
    visible: true,
  }).success,
).toBe(false);

expect(canAddNowLink(5)).toBe(true);
expect(canAddNowLink(6)).toBe(false);
```

- [ ] **Step 2: Run tests and confirm the new symbols are missing**

Run: `npm test -- --run src/lib/validation.test.ts src/lib/ordering.test.ts`

Expected: FAIL because `nowSectionSchema`, `nowLinkSchema`, and `canAddNowLink` do not exist.

- [ ] **Step 3: Implement the schemas and limit helper**

```ts
export const nowSectionSchema = z.object({
  description: z.string().trim().min(1).max(600),
  published: z.boolean(),
  showLastUpdated: z.boolean(),
});

export const nowLinkSchema = z
  .object({
    label: z.string().trim().min(1).max(80),
    url: z.url().startsWith("https://"),
    iconKey: iconObjectKey,
    iconAlt: optionalText(180),
    displayOrder: z.number().int().min(0).max(999),
    visible: z.boolean(),
  })
  .refine((value) => !value.iconKey || Boolean(value.iconAlt), {
    path: ["iconAlt"],
    message: "Alt text is required when an icon is uploaded.",
  });

export function canAddNowLink(existingLinks: number) {
  return existingLinks < 6;
}
```

- [ ] **Step 4: Run the focused tests**

Run: `npm test -- --run src/lib/validation.test.ts src/lib/ordering.test.ts`

Expected: PASS.

## Task 2: PostgreSQL schema and migration

**Files:**

- Modify: `src/db/schema.ts`
- Modify: `src/db/schema.integration.test.ts`
- Create: `drizzle/0004_*.sql`
- Create: `drizzle/meta/0004_snapshot.json`
- Modify: `drizzle/meta/_journal.json`

- [ ] **Step 1: Extend the integration expectation**

Add `now_links` and `now_section` to the expected public application tables.

```ts
expect(tables.map((row) => row.table_name)).toContain("now_links");
expect(tables.map((row) => row.table_name)).toContain("now_section");
```

- [ ] **Step 2: Define focused Drizzle tables**

```ts
export const nowSection = pgTable(
  "now_section",
  {
    id: integer("id").primaryKey().default(1),
    description: text("description").notNull(),
    published: boolean("published").notNull().default(false),
    showLastUpdated: boolean("show_last_updated").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [check("now_section_singleton", sql`${table.id} = 1`)],
);

export const nowLinks = pgTable(
  "now_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    label: text("label").notNull(),
    url: text("url").notNull(),
    iconKey: text("icon_key"),
    iconAlt: text("icon_alt"),
    displayOrder: integer("display_order").notNull().default(0),
    visible: boolean("visible").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    index("now_links_visible_order_idx").on(table.visible, table.displayOrder),
    check(
      "now_links_icon_alt_required",
      sql`${table.iconKey} is null or length(trim(${table.iconAlt})) > 0`,
    ),
  ],
);
```

- [ ] **Step 3: Generate and inspect the migration**

Run: `npm run db:generate`

Expected: one migration creating both tables, their singleton/alt checks, and the visibility/order index.

- [ ] **Step 4: Apply the migration to Neon**

Run: `npm run db:migrate`

Expected: migrations applied successfully. Verify the migration file SHA-256 equals the latest `drizzle.__drizzle_migrations.hash` value.

## Task 3: Public and admin queries

**Files:**

- Modify: `src/db/queries.ts`

- [ ] **Step 1: Add safe defaults and public data reads**

Add a default unpublished section and extend the cached homepage query with `nowSection` and ordered visible `nowLinks` queries. Return `now: null` unless the row is published.

```ts
const section = nowSectionRows[0];
return {
  settings: settingsRows[0] ?? defaultSiteSettings,
  now: section?.published ? { ...section, links: nowLinkRows } : null,
  projects: projectRows,
  recognitions: recognitionRows,
};
```

- [ ] **Step 2: Add protected admin reads**

```ts
export async function getAdminNow() {
  const [sectionRows, links] = await Promise.all([
    getDb().select().from(nowSection).where(eq(nowSection.id, 1)).limit(1),
    getDb()
      .select()
      .from(nowLinks)
      .orderBy(asc(nowLinks.displayOrder), asc(nowLinks.createdAt)),
  ]);
  return { section: sectionRows[0] ?? defaultNowSection, links };
}
```

- [ ] **Step 3: Include visible Now-link icons in public media references**

Query `now_links` by `icon_key` and `visible = true`, then include it in the final boolean returned by `isReferencedPublicMedia`.

## Task 4: Protected Server Actions

**Files:**

- Create: `src/app/admin/actions/now.ts`
- Modify: `src/app/admin/actions/shared.ts`

- [ ] **Step 1: Add section settings mutation**

Implement `saveNowSection(input)` with `requireAdmin`, Zod parsing, singleton upsert, structured error logging, and homepage invalidation.

- [ ] **Step 2: Add link limit and icon validation**

Before creating a link, count all `now_links` and return `Only six Now links can be created.` when `canAddNowLink` returns false. Add a database trigger that takes a transaction-scoped advisory lock and enforces the same limit so concurrent requests cannot both create a seventh row. Test competing inserts against an isolated database. Call `assertStoredUpload(iconKey, "icon")` when an icon is provided.

- [ ] **Step 3: Save links and touch the section atomically**

Use a generated UUID for creates and `getDb().batch([linkMutation, sectionTouch])`, where `sectionTouch` upserts the singleton and sets the same `now` timestamp. Return the known link ID, invalidate `/`, then remove a replaced icon.

- [ ] **Step 4: Delete links and touch the section atomically**

Read the existing link first, batch the delete with the section timestamp update, invalidate public content, and only then remove its R2 object.

- [ ] **Step 5: Keep cache invalidation focused**

Update `refreshPublicContent` only if needed so the existing `portfolio` tag and `/` revalidation cover Now changes without introducing a new public API.

## Task 5: Admin Now page

**Files:**

- Create: `src/app/admin/(protected)/now/page.tsx`
- Create: `src/components/admin/now-manager.tsx`
- Modify: `src/components/admin/admin-nav.tsx`

- [ ] **Step 1: Add the protected page and navigation entry**

Add a `Clock3`-icon link for `/admin/now` between Projects and Recognitions. The page calls `getAdminNow()` and renders `AdminPageHeader` plus `NowManager`.

- [ ] **Step 2: Build the section form**

Use React Hook Form with `nowSectionSchema`, a textarea, shadcn Switch fields for Published and Show last updated, a pending Save button, field errors, Sonner feedback, and a reload after success.

- [ ] **Step 3: Build linked-item management**

Follow the existing recognition/technology manager pattern: ordered cards, visible/hidden badge, create/edit shadcn Dialog, delete AlertDialog, `UploadField`, HTTPS URL field, order field, visibility switch, pending states, orphan upload cleanup, and a disabled Add button with explanatory text at six records.

## Task 6: Public Now component

**Files:**

- Create: `src/components/portfolio/now-section.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Build the server-rendered component**

Render `SectionHeading title="Now"`, the plain description, wrapping linked chips with `AssetIcon size="sm"`, external-link icons, and a locale-stable `Last updated Month YYYY` line when enabled.

```ts
const lastUpdated = new Intl.DateTimeFormat("en", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
}).format(section.updatedAt);
```

- [ ] **Step 2: Place it between the hero and Recent Projects**

Destructure `now` from `getPublicPortfolio()` and conditionally render `<NowSection section={now} />` after the hero section. Use compact top spacing while preserving the larger gap before Recent Projects.

- [ ] **Step 3: Verify empty and hidden behavior**

Confirm unpublished data renders no heading or empty-state card and a published section with zero links still renders its description and date.

## Task 7: Automated and visual verification

**Files:**

- Modify: `src/lib/validation.test.ts`
- Modify: `src/lib/ordering.test.ts`
- Modify: `src/db/schema.integration.test.ts`

- [ ] **Step 1: Run focused tests**

Run: `npm test -- --run src/lib/validation.test.ts src/lib/ordering.test.ts`

Expected: all focused tests pass.

- [ ] **Step 2: Run repository checks**

Run: `npm run typecheck`, `npm test -- --run`, `npm run lint`, and `git diff --check`.

Expected: no errors; the optional migration integration test may remain skipped when `TEST_DATABASE_URL` is absent.

- [ ] **Step 3: Run the production build**

Stop only the process listening on port 3000, run `npm run build`, then restart `npm run dev` hidden on port 3000.

Expected: all public, admin, media, and auth routes compile successfully.

- [ ] **Step 4: Verify the rendered experience**

Use the in-app browser when available, otherwise Playwright fallback, to inspect the homepage and `/admin/now`. Check desktop and mobile wrapping, heading/description hierarchy, chip focus states, update-date formatting, unpublished omission, dialog labels, keyboard accessibility, and console errors.

## Task 8: Commit the completed vertical slice

**Files:**

- All Now-section implementation, migration, test, spec, and plan files

- [ ] **Step 1: Review the diff without disturbing existing redesign changes**

Run `git status --short` and `git diff --stat`. Confirm no unrelated user-owned files were removed or reverted.

- [ ] **Step 2: Commit the coherent redesign/Now implementation only when requested**

Use an intentional commit message such as `feat: add admin-managed now section`. Do not push unless explicitly requested.
