ALTER TABLE "recognitions" DROP CONSTRAINT "recognitions_icon_alt_required";--> statement-breakpoint
ALTER TABLE "recognitions" DROP COLUMN "issuer";--> statement-breakpoint
ALTER TABLE "recognitions" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "recognitions" DROP COLUMN "recognized_on";--> statement-breakpoint
ALTER TABLE "recognitions" DROP COLUMN "icon_key";--> statement-breakpoint
ALTER TABLE "recognitions" DROP COLUMN "icon_alt";