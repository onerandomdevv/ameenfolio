ALTER TABLE "mcp_oauth_clients" ADD COLUMN "last_used_at" timestamp with time zone;
--> statement-breakpoint
CREATE INDEX "mcp_oauth_clients_last_used_idx" ON "mcp_oauth_clients" USING btree ("last_used_at");
