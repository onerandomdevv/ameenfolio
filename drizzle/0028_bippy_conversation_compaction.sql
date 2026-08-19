CREATE TABLE "agent_compactions" (
	"thread_id" uuid PRIMARY KEY NOT NULL,
	"summary" text NOT NULL,
	"compacted_message_count" integer NOT NULL,
	"source_tokens" integer NOT NULL,
	"summary_tokens" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_compactions_message_count_valid" CHECK ("agent_compactions"."compacted_message_count" >= 0),
	CONSTRAINT "agent_compactions_token_counts_valid" CHECK ("agent_compactions"."source_tokens" >= 0 and "agent_compactions"."summary_tokens" >= 0)
);--> statement-breakpoint
ALTER TABLE "agent_compactions" ADD CONSTRAINT "agent_compactions_thread_id_agent_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."agent_threads"("id") ON DELETE cascade ON UPDATE no action;
