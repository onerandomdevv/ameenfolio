-- The homepage now renders projects in two tiers off one ordered list: the
-- first eight as cards, the rest as compact rows. Twelve is what those two
-- tiers hold, so the limit moves from eight to twelve. Body is otherwise
-- unchanged from 0000.
CREATE OR REPLACE FUNCTION enforce_homepage_project_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.show_on_homepage AND NEW.published AND (
    SELECT count(*)
    FROM projects
    WHERE show_on_homepage = true
      AND published = true
      AND id <> NEW.id
  ) >= 12 THEN
    RAISE EXCEPTION 'No more than twelve published projects may appear on the homepage'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
