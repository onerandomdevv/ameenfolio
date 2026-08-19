ALTER TABLE "agent_media_uploads" ADD COLUMN "status" text DEFAULT 'ready' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_media_uploads" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "agent_media_uploads" ADD CONSTRAINT "agent_media_uploads_status_valid" CHECK ("agent_media_uploads"."status" in ('pending', 'ready', 'deleting', 'deleted'));--> statement-breakpoint
CREATE OR REPLACE FUNCTION lock_and_validate_post_article_images()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  media_key text;
BEGIN
  FOR media_key IN
    SELECT DISTINCT captures[1]
    FROM regexp_matches(
      NEW.body_markdown,
      '/media/(posts/[0-9]{4}/[a-f0-9]{48}\.(png|jpg|webp|gif))',
      'g'
    ) AS captures
    ORDER BY 1
  LOOP
    PERFORM pg_advisory_xact_lock(hashtextextended(media_key, 0));
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM (
      SELECT DISTINCT captures[1] AS object_key
      FROM regexp_matches(
        NEW.body_markdown,
        '/media/(posts/[0-9]{4}/[a-f0-9]{48}\.(png|jpg|webp|gif))',
        'g'
      ) AS captures
    ) AS referenced
    INNER JOIN agent_media_uploads AS upload
      ON upload.object_key = referenced.object_key
    WHERE upload.status <> 'ready'
  ) THEN
    RAISE EXCEPTION 'Post references an unavailable managed article image.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER posts_article_image_availability
BEFORE INSERT OR UPDATE OF body_markdown ON posts
FOR EACH ROW
EXECUTE FUNCTION lock_and_validate_post_article_images();
