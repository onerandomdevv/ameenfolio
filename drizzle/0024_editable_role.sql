-- The role line under the name joins the other identity fields in the admin.
-- Nullable for the same reason as display_name and introduction: NULL means
-- never edited, so src/config/portfolio.ts keeps supplying it until then.

ALTER TABLE "site_settings"
  ADD COLUMN IF NOT EXISTS "role" text;
