CREATE TABLE "post_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_categories_name_present" CHECK (length(trim("post_categories"."name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"body_markdown" text NOT NULL,
	"body_html" text NOT NULL,
	"headings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"category_id" uuid,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"pinned_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_shape" CHECK ("posts"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "post_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"icon_name" text DEFAULT 'link' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_post_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."post_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_links" ADD CONSTRAINT "post_links_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "post_categories_name_idx" ON "post_categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "post_categories_order_idx" ON "post_categories" USING btree ("display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "posts_published_idx" ON "posts" USING btree ("published","published_at");--> statement-breakpoint
CREATE INDEX "posts_pinned_idx" ON "posts" USING btree ("published","pinned","pinned_order");--> statement-breakpoint
CREATE INDEX "post_links_post_order_idx" ON "post_links" USING btree ("post_id","display_order");--> statement-breakpoint
-- The homepage shows five pinned posts. Enforced here as well as in the admin
-- action, for the same reason the homepage project limit is: the action can
-- only speak for the request it is handling, and two saves racing each other
-- would both read four and both write a fifth.
CREATE OR REPLACE FUNCTION enforce_pinned_post_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.pinned AND NEW.published AND (
    SELECT count(*)
    FROM posts
    WHERE pinned = true
      AND published = true
      AND id <> NEW.id
  ) >= 5 THEN
    RAISE EXCEPTION 'No more than five published posts may be pinned to the homepage'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER posts_pinned_limit
BEFORE INSERT OR UPDATE OF pinned, published ON posts
FOR EACH ROW EXECUTE FUNCTION enforce_pinned_post_limit();
