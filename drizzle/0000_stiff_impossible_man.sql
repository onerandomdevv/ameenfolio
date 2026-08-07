CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"short_description" text NOT NULL,
	"contribution" text,
	"status_label" text,
	"live_url" text NOT NULL,
	"github_url" text,
	"icon_key" text,
	"icon_alt" text,
	"show_on_homepage" boolean DEFAULT false NOT NULL,
	"homepage_order" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_icon_alt_required" CHECK ("projects"."icon_key" is null or length(trim("projects"."icon_alt")) > 0)
);
--> statement-breakpoint
CREATE TABLE "recognitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"issuer" text NOT NULL,
	"description" text NOT NULL,
	"recognized_on" date,
	"verification_url" text,
	"icon_key" text,
	"icon_alt" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recognitions_icon_alt_required" CHECK ("recognitions"."icon_key" is null or length(trim("recognitions"."icon_alt")) > 0)
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"introduction" text NOT NULL,
	"email" text NOT NULL,
	"social_links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"resume_key" text,
	"resume_filename" text,
	"seo_title" text NOT NULL,
	"seo_description" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_singleton" CHECK ("site_settings"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "technologies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"website_url" text,
	"icon_key" text,
	"icon_alt" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "technologies_icon_alt_required" CHECK ("technologies"."icon_key" is null or length(trim("technologies"."icon_alt")) > 0)
);
--> statement-breakpoint
CREATE INDEX "projects_published_idx" ON "projects" USING btree ("published");--> statement-breakpoint
CREATE INDEX "projects_homepage_idx" ON "projects" USING btree ("published","show_on_homepage","homepage_order");--> statement-breakpoint
CREATE INDEX "recognitions_public_idx" ON "recognitions" USING btree ("published","display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "technologies_name_unique" ON "technologies" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "technologies_visible_order_idx" ON "technologies" USING btree ("visible","category","display_order");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION enforce_homepage_project_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.show_on_homepage AND NEW.published AND (
    SELECT count(*)
    FROM projects
    WHERE show_on_homepage = true
      AND published = true
      AND id <> NEW.id
  ) >= 8 THEN
    RAISE EXCEPTION 'No more than eight published projects may appear on the homepage'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER projects_homepage_limit
BEFORE INSERT OR UPDATE OF show_on_homepage, published ON projects
FOR EACH ROW EXECUTE FUNCTION enforce_homepage_project_limit();
