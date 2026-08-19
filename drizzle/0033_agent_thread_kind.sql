ALTER TABLE "agent_threads" ADD COLUMN "kind" text DEFAULT 'chat' NOT NULL;
--> statement-breakpoint
UPDATE "agent_threads"
SET "kind" = 'mcp_audit'
WHERE "id" IN (
  SELECT "thread_id"
  FROM "mcp_oauth_clients"
  WHERE "thread_id" IS NOT NULL
)
OR "title" LIKE '% · Bippy MCP';
--> statement-breakpoint
ALTER TABLE "agent_threads" ADD CONSTRAINT "agent_threads_kind_valid" CHECK ("agent_threads"."kind" in ('chat', 'mcp_audit'));
--> statement-breakpoint
CREATE INDEX "agent_threads_kind_updated_idx" ON "agent_threads" USING btree ("kind", "updated_at");
