# Hardcoded Tech Stack Design

## Goal

Replace the database-managed Tech Stack with a compact, hardcoded presentation that matches approved visual option A. The section should communicate the technologies Aliameen actively uses without competing with the projects and recognitions above it.

## Content

The section keeps the fixed `Tech Stack` heading and contains exactly two groups in this order.

### Core Stack

1. JavaScript (`JS`)
2. TypeScript (`TS`)
3. React (`R`)
4. Next.js (`N`)
5. Tailwind CSS (`TW`)
6. Node.js (`N`)
7. NestJS (`N`)
8. PostgreSQL (`PG`)
9. MongoDB (`M`)
10. Redis (`R`)
11. Prisma (`P`)
12. Zustand (`Z`)

### Tools & Infrastructure

1. Docker (`D`)
2. GitHub Actions (`GH`)
3. Cloudflare (`CF`)
4. AWS (`AWS`)
5. Google Cloud Platform (`G`), displayed as `GCP`
6. Nginx (`N`)

The following are deliberately excluded: Auth.js/NextAuth, Passport.js, JWT, OAuth, generic NoSQL, Claude, Codex, Gemini, and CodeRabbit.

## Visual Design

- Reproduce approved option A rather than introducing a new interpretation.
- Render each technology as a compact rectangular chip with a subtle border, dark neutral background, small corner radius, and technology name.
- Start every chip with a small coloured square containing the approved text abbreviation. These text boxes are the visual representation; do not use uploaded images, remote badges, external SVGs, or logo packages.
- Use restrained, recognisable brand-inspired colours for the abbreviation boxes while maintaining sufficient contrast.
- Keep the chip text neutral and let only the abbreviation box carry colour.
- Use a wrapping single-column mobile layout that naturally creates additional rows, with no horizontal scrolling.
- Keep group labels small and muted. `Core Stack` appears first and `Tools & Infrastructure` follows with deliberate vertical separation.
- Preserve the existing black/electric-lime portfolio identity; the section heading remains electric lime.
- Respect the established narrow desktop canvas and left alignment.

## Component Architecture

- Store the stack as typed immutable data in `src/config/tech-stack.ts`.
- Each entry contains a stable identifier, display name, abbreviation, background colour, foreground colour, and group.
- Create a focused public `TechStackSection` server component that owns the semantic section, group headings, and chip rendering.
- Use the existing shadcn `Badge` component as the chip foundation and render the abbreviation box inside it.
- Mark abbreviation boxes as decorative because the adjacent technology name provides the accessible label.
- Keep the implementation server-rendered and dependency-free; no client state or JavaScript is required.

## Removal of Dynamic Management

Because Tech Stack content is intentionally hardcoded:

- Remove the Technologies entry from the admin navigation.
- Remove `/admin/technologies`, its manager component, Server Actions, and technology form validation.
- Remove technology queries from the public portfolio and admin query modules.
- Remove R2 media-reference handling for technology icons.
- Remove the `technologies` table from the active Drizzle schema and generate a forward migration that drops the obsolete table.
- Keep historical migrations unchanged; only the new forward migration may remove the table.
- Do not migrate or seed existing technology records.

## Behaviour and Accessibility

- Render all configured technologies in the declared order.
- Chips are informational, not links or buttons.
- Use semantic section headings, group headings, and lists.
- Ensure abbreviation boxes meet contrast requirements.
- Prevent horizontal overflow at 360px and wider.
- Do not add proficiency levels, percentages, descriptions, filters, animation, or hover-only behaviour.

## Verification Scope

During the ongoing redesign, run only focused checks for this change:

- Unit-test the hardcoded group names, exact entries, and ordering.
- Verify the public homepage exposes both group headings and every configured technology.
- Verify the admin no longer exposes technology management.
- Verify the Drizzle schema and generated migration remove the technologies table.
- Check the section at 360px and 390px for wrapping and horizontal overflow.

Full repository build, lint, formatting, and complete test-suite checks remain deferred until the user confirms the broader redesign is ready for final verification.
