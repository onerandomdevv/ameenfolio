ALTER TABLE "agent_threads" ADD COLUMN "pinned_at" timestamp with time zone;
--> statement-breakpoint
CREATE INDEX "agent_threads_pinned_idx" ON "agent_threads" USING btree ("pinned_at");
