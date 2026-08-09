CREATE TABLE "tech_stack_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"group_key" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tech_stack_group_key_valid" CHECK ("tech_stack_items"."group_key" in ('core', 'tools'))
);
--> statement-breakpoint
CREATE INDEX "tech_stack_public_idx" ON "tech_stack_items" USING btree ("visible","group_key","display_order");--> statement-breakpoint
-- Seeds the list that previously lived in src/config/tech-stack.ts. Without
-- this the section would render empty the moment the code deploys, and the
-- content would have to be retyped by hand.
INSERT INTO "tech_stack_items" ("name", "group_key", "display_order") VALUES
  ('JavaScript', 'core', 0),
  ('TypeScript', 'core', 1),
  ('React', 'core', 2),
  ('Next.js', 'core', 3),
  ('Tailwind CSS', 'core', 4),
  ('Node.js', 'core', 5),
  ('NestJS', 'core', 6),
  ('PostgreSQL', 'core', 7),
  ('MongoDB', 'core', 8),
  ('Redis', 'core', 9),
  ('Prisma', 'core', 10),
  ('Zustand', 'core', 11),
  ('Docker', 'tools', 0),
  ('GitHub Actions', 'tools', 1),
  ('Cloudflare', 'tools', 2),
  ('AWS', 'tools', 3),
  ('GCP', 'tools', 4),
  ('VPS', 'tools', 5),
  ('Nginx', 'tools', 6);
