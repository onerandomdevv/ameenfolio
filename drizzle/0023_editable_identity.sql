-- The name and the introduction under it were hardcoded in
-- src/config/portfolio.ts, which meant a change of job title needed a deploy.
--
-- Nullable rather than defaulted with the current copy: NULL means "never
-- edited", so the config keeps supplying the text until something is typed in
-- the admin, and the wording lives in one place until then.
--
-- The introduction now carries its own emphasis as **double asterisks** instead
-- of a separate list of phrases to match. The old list had to be edited in step
-- with the sentence or the emphasis silently stopped applying.

ALTER TABLE "site_settings"
  ADD COLUMN IF NOT EXISTS "display_name" text;--> statement-breakpoint

ALTER TABLE "site_settings"
  ADD COLUMN IF NOT EXISTS "introduction" text;
