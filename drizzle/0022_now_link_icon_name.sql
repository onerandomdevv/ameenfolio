-- A Now link can now carry a brand mark instead of an uploaded image: the
-- common case is a link to a GitHub repo or a YouTube video, where the real
-- logo is better than asking for a picture that already exists.
--
-- 'web' is the default and the fallback, so every existing row keeps the globe
-- it already shows. icon_key is untouched — an uploaded image still wins over
-- the mark when one is present.

ALTER TABLE "now_links"
  ADD COLUMN IF NOT EXISTS "icon_name" text DEFAULT 'web' NOT NULL;--> statement-breakpoint

ALTER TABLE "now_links"
  DROP CONSTRAINT IF EXISTS "now_links_icon_name_known";--> statement-breakpoint

ALTER TABLE "now_links"
  ADD CONSTRAINT "now_links_icon_name_known"
  CHECK ("icon_name" IN ('web', 'github', 'x', 'instagram', 'youtube'));
