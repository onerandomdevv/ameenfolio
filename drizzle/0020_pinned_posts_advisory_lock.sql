-- The count(*) in the pin trigger reads the transaction's snapshot, so two
-- saves racing each other at four pinned posts both see four and both commit a
-- fifth — six pinned posts on a homepage that shows five. The now_links limit
-- already solves this with an advisory lock; this brings the pin limit into
-- line with it. The lock is transaction-scoped, so it releases on commit or
-- rollback without any explicit unlock.
CREATE OR REPLACE FUNCTION enforce_pinned_post_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.pinned AND NEW.published THEN
    PERFORM pg_advisory_xact_lock(hashtext('ameenfolio_pinned_posts_limit'));
    IF (
      SELECT count(*)
      FROM posts
      WHERE pinned = true
        AND published = true
        AND id <> NEW.id
    ) >= 5 THEN
      RAISE EXCEPTION 'No more than five published posts may be pinned to the homepage'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
