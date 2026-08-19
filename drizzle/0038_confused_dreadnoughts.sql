CREATE TABLE "recognition_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recognition_id" uuid NOT NULL,
	"object_key" text NOT NULL,
	"alt" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recognitions" ADD COLUMN "article_post_id" uuid;--> statement-breakpoint
ALTER TABLE "recognitions" ADD COLUMN "external_post_url" text;--> statement-breakpoint
ALTER TABLE "recognition_images" ADD CONSTRAINT "recognition_images_recognition_id_recognitions_id_fk" FOREIGN KEY ("recognition_id") REFERENCES "public"."recognitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recognition_images_order_idx" ON "recognition_images" USING btree ("recognition_id","display_order");--> statement-breakpoint
ALTER TABLE "recognitions" ADD CONSTRAINT "recognitions_article_post_id_posts_id_fk" FOREIGN KEY ("article_post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;