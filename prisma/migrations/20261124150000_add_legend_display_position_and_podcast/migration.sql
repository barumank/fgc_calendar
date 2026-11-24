ALTER TABLE "LegendCard" RENAME COLUMN "discipline" TO "nomination";

ALTER TABLE "LegendCard"
ADD COLUMN "displayPosition" INTEGER,
ADD COLUMN "podcastUrl" TEXT;

UPDATE "LegendCard"
SET "displayPosition" = "legendNumber"
WHERE "displayPosition" IS NULL;

ALTER TABLE "LegendCard"
ALTER COLUMN "displayPosition" SET NOT NULL;

CREATE UNIQUE INDEX "LegendCard_displayPosition_key" ON "LegendCard"("displayPosition");
