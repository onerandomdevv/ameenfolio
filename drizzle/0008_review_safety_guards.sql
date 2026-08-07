-- 0003 predated the restored WhatsApp field and could copy a WhatsApp URL into
-- Instagram. Move only unmistakable WhatsApp URLs back, without touching real
-- Instagram values or settings that already contain a WhatsApp URL.
UPDATE "site_settings"
SET "social_links" = ("social_links" - 'instagram')
	|| jsonb_build_object('whatsapp', "social_links"->'instagram')
WHERE jsonb_typeof("social_links") = 'object'
	AND NOT ("social_links" ? 'whatsapp')
	AND "social_links" ? 'instagram'
	AND (
		lower("social_links"->>'instagram') LIKE 'https://wa.me/%'
		OR lower("social_links"->>'instagram') LIKE 'https://api.whatsapp.com/%'
		OR lower("social_links"->>'instagram') LIKE 'https://www.whatsapp.com/%'
	);--> statement-breakpoint

CREATE OR REPLACE FUNCTION enforce_now_links_limit()
RETURNS trigger AS $$
BEGIN
	-- Serialize competing inserts before counting so concurrent requests cannot
	-- both create a seventh row.
	PERFORM pg_advisory_xact_lock(hashtext('ameenfolio_now_links_limit'));
	IF (SELECT count(*) FROM "now_links") >= 6 THEN
		RAISE EXCEPTION 'now_links_limit_exceeded'
			USING ERRCODE = '23514';
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

DROP TRIGGER IF EXISTS "now_links_limit" ON "now_links";--> statement-breakpoint
CREATE TRIGGER "now_links_limit"
	BEFORE INSERT ON "now_links"
	FOR EACH ROW EXECUTE FUNCTION enforce_now_links_limit();
