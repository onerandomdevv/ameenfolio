-- Placement everywhere becomes "what is pinned, newest pin first". The three
-- ordering integers go; a pinned_at timestamp replaces them, because the
-- homepage only ever needed an order and the moment something was pinned
-- already is one. Null means not pinned.
--
-- Existing order is preserved rather than reset: rows are back-dated so the
-- current ascending display order comes out as descending pin order.
--
-- The triggers are dropped first. Each is declared UPDATE OF <column>, so the
-- columns they name cannot be dropped while they exist.

DROP TRIGGER IF EXISTS projects_homepage_limit ON projects;--> statement-breakpoint
DROP TRIGGER IF EXISTS posts_pinned_limit ON posts;--> statement-breakpoint

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "pinned_at" timestamp with time zone;--> statement-breakpoint
UPDATE "projects"
SET "pinned_at" = now() - (COALESCE("homepage_order", 0) * interval '1 second')
WHERE "show_on_homepage" = true AND "published" = true AND "pinned_at" IS NULL;--> statement-breakpoint
DROP INDEX IF EXISTS "projects_homepage_idx";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN IF EXISTS "show_on_homepage";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN IF EXISTS "homepage_order";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_pinned_idx" ON "projects" USING btree ("published","pinned_at");--> statement-breakpoint

ALTER TABLE "recognitions" ADD COLUMN IF NOT EXISTS "pinned_at" timestamp with time zone;--> statement-breakpoint
-- Every published recognition was already on the homepage, so they all carry
-- their pin across rather than silently vanishing from the site.
UPDATE "recognitions"
SET "pinned_at" = now() - (COALESCE("display_order", 0) * interval '1 second')
WHERE "published" = true AND "pinned_at" IS NULL;--> statement-breakpoint
DROP INDEX IF EXISTS "recognitions_public_idx";--> statement-breakpoint
ALTER TABLE "recognitions" DROP COLUMN IF EXISTS "display_order";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recognitions_public_idx" ON "recognitions" USING btree ("published","pinned_at");--> statement-breakpoint

ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "pinned_at" timestamp with time zone;--> statement-breakpoint
UPDATE "posts"
SET "pinned_at" = now() - (COALESCE("pinned_order", 0) * interval '1 second')
WHERE "pinned" = true AND "published" = true AND "pinned_at" IS NULL;--> statement-breakpoint
DROP INDEX IF EXISTS "posts_pinned_idx";--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN IF EXISTS "pinned";--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN IF EXISTS "pinned_order";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_pinned_idx" ON "posts" USING btree ("published","pinned_at");--> statement-breakpoint

-- Writing has no categories. The column goes before the table it points at.
ALTER TABLE "posts" DROP COLUMN IF EXISTS "category_id";--> statement-breakpoint
DROP TABLE IF EXISTS "post_categories";--> statement-breakpoint

-- The Now section never prints an updated date, so the switch that drove it
-- has nothing left to control.
ALTER TABLE "now_section" DROP COLUMN IF EXISTS "show_last_updated";--> statement-breakpoint

-- Both caps move to counting pinned rows. The advisory lock stays: count(*)
-- reads the transaction snapshot, so without it two saves racing each other
-- can both pass the check.
CREATE OR REPLACE FUNCTION enforce_homepage_project_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.pinned_at IS NOT NULL AND NEW.published THEN
    PERFORM pg_advisory_xact_lock(hashtext('ameenfolio_pinned_projects_limit'));
    IF (
      SELECT count(*)
      FROM projects
      WHERE pinned_at IS NOT NULL
        AND published = true
        AND id <> NEW.id
    ) >= 12 THEN
      RAISE EXCEPTION 'No more than twelve projects may be pinned to the homepage'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER projects_homepage_limit
BEFORE INSERT OR UPDATE OF pinned_at, published ON projects
FOR EACH ROW EXECUTE FUNCTION enforce_homepage_project_limit();--> statement-breakpoint

CREATE OR REPLACE FUNCTION enforce_pinned_post_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.pinned_at IS NOT NULL AND NEW.published THEN
    PERFORM pg_advisory_xact_lock(hashtext('ameenfolio_pinned_posts_limit'));
    IF (
      SELECT count(*)
      FROM posts
      WHERE pinned_at IS NOT NULL
        AND published = true
        AND id <> NEW.id
    ) >= 5 THEN
      RAISE EXCEPTION 'No more than five posts may be pinned to the homepage'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER posts_pinned_limit
BEFORE INSERT OR UPDATE OF pinned_at, published ON posts
FOR EACH ROW EXECUTE FUNCTION enforce_pinned_post_limit();
