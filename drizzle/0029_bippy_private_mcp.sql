CREATE TABLE "mcp_oauth_clients" (
  "client_id" text PRIMARY KEY NOT NULL,
  "client_name" text NOT NULL,
  "redirect_uris" jsonb NOT NULL,
  "thread_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_oauth_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code_hash" text NOT NULL,
  "client_id" text NOT NULL,
  "user_id" text NOT NULL,
  "owner_github_user_id" text NOT NULL,
  "redirect_uri" text NOT NULL,
  "code_challenge" text NOT NULL,
  "resource" text NOT NULL,
  "scopes" jsonb NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_oauth_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "access_token_hash" text NOT NULL,
  "refresh_token_hash" text NOT NULL,
  "client_id" text NOT NULL,
  "user_id" text NOT NULL,
  "owner_github_user_id" text NOT NULL,
  "resource" text NOT NULL,
  "scopes" jsonb NOT NULL,
  "access_expires_at" timestamp with time zone NOT NULL,
  "refresh_expires_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mcp_oauth_clients" ADD CONSTRAINT "mcp_oauth_clients_thread_id_agent_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."agent_threads"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "mcp_oauth_codes" ADD CONSTRAINT "mcp_oauth_codes_client_id_mcp_oauth_clients_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."mcp_oauth_clients"("client_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "mcp_oauth_tokens" ADD CONSTRAINT "mcp_oauth_tokens_client_id_mcp_oauth_clients_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."mcp_oauth_clients"("client_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "mcp_oauth_clients_created_idx" ON "mcp_oauth_clients" USING btree ("created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_oauth_codes_hash_unique" ON "mcp_oauth_codes" USING btree ("code_hash");
--> statement-breakpoint
CREATE INDEX "mcp_oauth_codes_expiry_idx" ON "mcp_oauth_codes" USING btree ("expires_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_oauth_tokens_access_unique" ON "mcp_oauth_tokens" USING btree ("access_token_hash");
--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_oauth_tokens_refresh_unique" ON "mcp_oauth_tokens" USING btree ("refresh_token_hash");
--> statement-breakpoint
CREATE INDEX "mcp_oauth_tokens_access_expiry_idx" ON "mcp_oauth_tokens" USING btree ("access_expires_at");
