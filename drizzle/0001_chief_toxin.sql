ALTER TABLE "site_settings" ADD COLUMN "profile_image_key" text;
--> statement-breakpoint
UPDATE "site_settings"
SET
  "name" = 'Aliameen Kareem',
  "role" = 'Full-Stack Engineer',
  "updated_at" = now()
WHERE "id" = 1
  AND "name" = 'Ameen'
  AND "role" = 'Product Engineer';
