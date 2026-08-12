-- Recognitions were left uncapped when projects and posts were given one,
-- because there was no second tier for them to overflow into. The homepage now
-- shows pinned recognitions only, capped like the rest, and the full list lives
-- on the writing page.
--
-- The advisory lock is what makes the count trustworthy: without it two pins
-- arriving together can both read eleven and both insert, leaving thirteen.
-- Same lock-then-count shape as the projects and posts triggers.

CREATE OR REPLACE FUNCTION enforce_pinned_recognition_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.pinned_at IS NOT NULL AND NEW.published THEN
    PERFORM pg_advisory_xact_lock(hashtext('ameenfolio_pinned_recognitions_limit'));
    IF (
      SELECT count(*)
      FROM recognitions
      WHERE pinned_at IS NOT NULL
        AND published = true
        AND id <> NEW.id
    ) >= 12 THEN
      RAISE EXCEPTION 'No more than twelve recognitions may be pinned to the homepage'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint

DROP TRIGGER IF EXISTS recognitions_pinned_limit ON recognitions;--> statement-breakpoint

CREATE TRIGGER recognitions_pinned_limit
BEFORE INSERT OR UPDATE OF pinned_at, published ON recognitions
FOR EACH ROW EXECUTE FUNCTION enforce_pinned_recognition_limit();
