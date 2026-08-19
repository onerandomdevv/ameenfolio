-- The Now section shows at most four links now, down from six. CREATE OR
-- REPLACE swaps the function body in place; the trigger keeps pointing at it,
-- so nothing is dropped and existing rows are untouched.
--
-- Rows already above the new limit are left alone deliberately: the trigger
-- fires BEFORE INSERT only, so shrinking the cap never deletes content the
-- owner put there. It just stops new links until they are back under it.
CREATE OR REPLACE FUNCTION enforce_now_links_limit()
RETURNS trigger AS $$
BEGIN
	-- Serialize competing inserts before counting so concurrent requests cannot
	-- both create a fifth row.
	PERFORM pg_advisory_xact_lock(hashtext('ameenfolio_now_links_limit'));
	IF (SELECT count(*) FROM "now_links") >= 4 THEN
		RAISE EXCEPTION 'now_links_limit_exceeded'
			USING ERRCODE = '23514';
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;
