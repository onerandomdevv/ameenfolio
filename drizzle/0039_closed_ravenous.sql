ALTER TABLE "recognition_images" ALTER COLUMN "alt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "recognitions" ADD COLUMN "images_caption" text;