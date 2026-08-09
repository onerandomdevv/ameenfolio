ALTER TABLE "stats_snapshot" ADD COLUMN "current_streak_start" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stats_snapshot" ADD COLUMN "current_streak_end" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stats_snapshot" ADD COLUMN "longest_streak_start" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stats_snapshot" ADD COLUMN "longest_streak_end" timestamp with time zone;