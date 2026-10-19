ALTER TABLE "cards" ADD COLUMN "parent_id" text;--> statement-breakpoint
CREATE INDEX "cards_parent" ON "cards" USING btree ("parent_id");