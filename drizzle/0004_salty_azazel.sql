CREATE TABLE "now_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"icon_key" text,
	"icon_alt" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "now_links_icon_alt_required" CHECK ("now_links"."icon_key" is null or length(trim("now_links"."icon_alt")) > 0)
);
--> statement-breakpoint
CREATE TABLE "now_section" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"description" text NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"show_last_updated" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "now_section_singleton" CHECK ("now_section"."id" = 1)
);
--> statement-breakpoint
CREATE INDEX "now_links_visible_order_idx" ON "now_links" USING btree ("visible","display_order");