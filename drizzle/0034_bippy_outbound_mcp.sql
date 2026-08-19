CREATE TABLE "bippy_mcp_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"server_url" text NOT NULL,
	"auth_type" text DEFAULT 'none' NOT NULL,
	"encrypted_credential" text,
	"enabled" boolean DEFAULT false NOT NULL,
	"allowed_tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"read_only_tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"discovered_tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_connected_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bippy_mcp_connections_auth_type_valid" CHECK ("bippy_mcp_connections"."auth_type" in ('none', 'bearer'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "bippy_mcp_connections_url_unique" ON "bippy_mcp_connections" USING btree ("server_url");
--> statement-breakpoint
CREATE INDEX "bippy_mcp_connections_enabled_idx" ON "bippy_mcp_connections" USING btree ("enabled");
