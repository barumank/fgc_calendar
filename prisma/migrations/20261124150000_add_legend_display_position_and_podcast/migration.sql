ALTER TABLE "LegendCard"
ADD COLUMN "displayPosition" INTEGER,
ADD COLUMN "podcastUrl" TEXT;

UPDATE "LegendCard"
SET "displayPosition" = "legendNumber"
WHERE "displayPosition" IS NULL;

ALTER TABLE "LegendCard"
ALTER COLUMN "displayPosition" SET NOT NULL;

ALTER TABLE "LegendCard"
ALTER COLUMN "displayPosition" SET DEFAULT 1;

CREATE INDEX "LegendCard_displayPosition_idx" ON "LegendCard"("displayPosition");
