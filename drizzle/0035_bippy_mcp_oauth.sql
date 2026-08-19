ALTER TABLE "bippy_mcp_connections" DROP CONSTRAINT "bippy_mcp_connections_auth_type_valid";
--> statement-breakpoint
ALTER TABLE "bippy_mcp_connections" ADD CONSTRAINT "bippy_mcp_connections_auth_type_valid" CHECK ("bippy_mcp_connections"."auth_type" in ('none', 'bearer', 'oauth'));
