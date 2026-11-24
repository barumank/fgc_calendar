UPDATE "LegendCard"
SET "comment" = "achievement"
WHERE "comment" = '' AND "achievement" <> '';

ALTER TABLE "LegendCard"
ALTER COLUMN "achievement" SET DEFAULT '';
