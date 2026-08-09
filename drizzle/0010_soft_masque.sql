CREATE TABLE "stats_snapshot" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"contributions" integer DEFAULT 0 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"first_contribution_at" timestamp with time zone,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stats_snapshot_singleton" CHECK ("stats_snapshot"."id" = 1)
);
--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "hackathon_wins" integer DEFAULT 0 NOT NULL;