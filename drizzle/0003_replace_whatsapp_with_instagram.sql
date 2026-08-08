UPDATE "site_settings"
SET "social_links" = CASE
	WHEN "social_links" ? 'instagram' THEN "social_links" - 'whatsapp'
	ELSE ("social_links" - 'whatsapp') || jsonb_build_object('instagram', "social_links"->'whatsapp')
END
WHERE jsonb_typeof("social_links") = 'object'
	AND "social_links" ? 'whatsapp';
