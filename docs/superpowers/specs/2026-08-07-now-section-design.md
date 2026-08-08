# Now Section Design

## Purpose

Add a compact, administrator-managed “Now” section to the homepage. It communicates Aliameen’s current focus without introducing a career timeline, expandable employment history, or rich-text content.

The section is inspired by the first three parts of Kamran Ahmed’s implementation: a fixed heading, a current-focus statement, and a short row of linked items. It appears after the hero contact links and before Recent Projects.

## Public experience

- The visible heading is always `Now` and remains code-owned.
- The administrator writes one plain-text current-focus description.
- Zero to six visible linked items appear beneath the description.
- Each linked item has a label, HTTPS destination, optional icon, and administrator-defined order.
- Links use compact wrapping chips with an external-link indicator. They remain usable without an uploaded icon.
- A muted `Last updated Month YYYY` line appears when enabled.
- The update date comes from the section’s `updated_at` timestamp; it is never entered manually.
- Changing the description, publication settings, or any linked item refreshes the section timestamp.
- When unpublished, the entire section is omitted from public queries and markup.
- When published with no links, the description and optional update date still render.
- The layout remains one column and left-aligned at mobile widths, with no slider or hover-dependent action.

## Data model

### `now_section`

A database-enforced singleton row:

- `id`: integer primary key constrained to `1`
- `description`: required text
- `published`: required boolean, default `false`
- `show_last_updated`: required boolean, default `true`
- `updated_at`: required timezone-aware timestamp

### `now_links`

Repeatable linked items:

- `id`: UUID primary key
- `label`: required text
- `url`: required HTTPS URL
- `icon_key`: optional private-R2 object key
- `icon_alt`: optional text, required when an icon exists
- `display_order`: required integer
- `visible`: required boolean, default `true`
- created and updated timestamps

An index covers visibility and display ordering. Server validation and mutation logic enforce a maximum of six links. A separate table is used instead of JSON so ordering, individual editing, authorization, storage cleanup, and public-media reference checks stay explicit.

## Admin experience

Add `/admin/now` and a `Now` entry to the responsive admin navigation.

The page contains:

- A settings form for description, published state, and the show-last-updated toggle.
- A list of linked items in display order.
- An accessible shadcn dialog for creating or editing a linked item.
- A shadcn AlertDialog for deletion.
- Existing icon upload controls inside the link form; no separate media library.
- Pending states, server-returned field errors, and Sonner success/error feedback.

The description uses a normal textarea. There is no rich-text editor, manually entered update date, link description, category, status label, or internal detail page.

## Server behavior

- Public queries return the section only when it is published and only return visible links.
- Admin reads and every mutation require `requireAdmin` independently.
- Description/settings changes use an upsert for the singleton row.
- Link creation, editing, ordering, visibility changes, and deletion update `now_section.updated_at` in the same Drizzle transaction.
- Link changes are rejected when they would exceed six total records.
- Successful mutations invalidate `/` and the shared portfolio cache immediately.
- Replaced or deleted icon objects are removed only after the database transaction succeeds.
- Failed saves attempt cleanup of newly uploaded orphan objects.
- Structured server logs record CRUD, validation, upload, and cleanup failures.

## Storage and media

Now-link icons reuse the existing private R2 icon pipeline:

- PNG, JPEG, or WebP only
- Maximum 2 MB
- Generated `icons/...` keys only
- Public delivery through the existing media route or configured public media base URL
- Alt text required for an uploaded icon

The public-media reference check includes visible Now links so referenced icons remain deliverable and unreferenced objects can be cleaned safely.

## Presentation

- Position: hero contacts → Now → Recent Projects.
- Heading: existing lime section-heading treatment.
- Description: restrained body text, approximately 15–16px with readable line height.
- Link chips: compact outline/surface treatment, small icon, label, and external arrow; they wrap on narrow screens.
- Update date: smaller muted text below the links or description.
- Spacing remains closer to Kamran’s compact rhythm than the larger spacing used between major portfolio sections.
- The section preserves the existing black, white, grey, and electric-lime palette and visible focus states.

## Validation and failure states

- Description is trimmed, required, and limited to 600 characters.
- Link labels are trimmed, required, and limited to 80 characters.
- Link destinations must use HTTPS.
- Display order is an integer from 0 to 999.
- Icon keys must match the generated icon-key format.
- Alt text is required whenever an icon key is present.
- If no published row exists, the homepage omits the section rather than showing an empty-state card.
- Admin errors preserve entered form values and identify the affected field.

## Verification

- Unit tests cover settings and link validation, HTTPS enforcement, icon/alt coupling, and the six-link limit.
- Integration tests cover singleton upsert, link CRUD/order/visibility, timestamp refresh, published filtering, cache invalidation, and icon-reference checks.
- Authorization tests verify unauthenticated and non-admin callers cannot read protected data or mutate the section.
- Browser verification covers the homepage and admin workflow at mobile and desktop widths, keyboard navigation, dialog labels, focus visibility, link wrapping, hidden/unpublished states, and the formatted update date.
- Type checking, linting, tests, and the production build must pass before completion.

## Explicit exclusions

- No employment timeline or “Before that” content
- No expandable company panels
- No rich-text editor
- No manually entered last-updated date
- No link descriptions or categories
- No more than six linked items
- No separate public page for the section
