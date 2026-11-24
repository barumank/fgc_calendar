UPDATE "LegendCard"
SET "comment" = "achievement"
WHERE "comment" = '' AND "achievement" <> '';

ALTER TABLE "LegendCard"
DROP COLUMN "achievement";
