CREATE TABLE "agent_memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"content" text NOT NULL,
	"category" text DEFAULT 'preference' NOT NULL,
	"source_thread_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_memories_category_valid" CHECK ("agent_memories"."category" in ('preference', 'fact', 'instruction'))
);--> statement-breakpoint
ALTER TABLE "agent_memories" ADD CONSTRAINT "agent_memories_source_thread_id_agent_threads_id_fk" FOREIGN KEY ("source_thread_id") REFERENCES "public"."agent_threads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_memories_label_unique" ON "agent_memories" USING btree ("label");--> statement-breakpoint
CREATE INDEX "agent_memories_updated_idx" ON "agent_memories" USING btree ("updated_at");
