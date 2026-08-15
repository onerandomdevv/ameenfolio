CREATE TABLE "agent_media_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"object_key" text NOT NULL,
	"content_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"client_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_media_uploads_byte_size_positive" CHECK ("agent_media_uploads"."byte_size" > 0)
);
--> statement-breakpoint
ALTER TABLE "agent_media_uploads" ADD CONSTRAINT "agent_media_uploads_client_id_mcp_oauth_clients_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."mcp_oauth_clients"("client_id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "agent_media_uploads_object_key_unique" ON "agent_media_uploads" USING btree ("object_key");
--> statement-breakpoint
CREATE INDEX "agent_media_uploads_created_idx" ON "agent_media_uploads" USING btree ("created_at");
