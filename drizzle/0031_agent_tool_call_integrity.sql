CREATE INDEX "agent_tool_calls_thread_idx" ON "agent_tool_calls" USING btree ("thread_id", "created_at");--> statement-breakpoint
ALTER TABLE "agent_tool_calls" ADD CONSTRAINT "agent_tool_calls_status_valid" CHECK ("agent_tool_calls"."status" in ('running', 'completed', 'failed'));
