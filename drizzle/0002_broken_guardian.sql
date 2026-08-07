ALTER TABLE "site_settings" ALTER COLUMN "social_links" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
UPDATE "site_settings"
SET "social_links" = CASE
	WHEN jsonb_typeof("social_links") = 'array' THEN jsonb_strip_nulls(
		jsonb_build_object(
			'github', (
				SELECT item->>'url'
				FROM jsonb_array_elements("social_links") AS item
				WHERE lower(item->>'label') = 'github'
				LIMIT 1
			),
			'x', (
				SELECT item->>'url'
				FROM jsonb_array_elements("social_links") AS item
				WHERE lower(item->>'label') IN ('x', 'twitter', 'x (twitter)')
				LIMIT 1
			),
			'whatsapp', (
				SELECT item->>'url'
				FROM jsonb_array_elements("social_links") AS item
				WHERE lower(item->>'label') = 'whatsapp'
				LIMIT 1
			)
		)
	)
	WHEN jsonb_typeof("social_links") = 'object' THEN "social_links"
	ELSE '{}'::jsonb
END;--> statement-breakpoint
ALTER TABLE "site_settings" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "site_settings" DROP COLUMN "role";--> statement-breakpoint
ALTER TABLE "site_settings" DROP COLUMN "introduction";
