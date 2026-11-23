-- Persist one candidate submission per user for each legend voting round.
CREATE TABLE "LegendVote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "legendNumber" INTEGER NOT NULL,
    "nickname" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegendVote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LegendVote_userId_legendNumber_key"
ON "LegendVote"("userId", "legendNumber");

CREATE INDEX "LegendVote_legendNumber_createdAt_idx"
ON "LegendVote"("legendNumber", "createdAt");

CREATE INDEX "LegendVote_createdAt_idx"
ON "LegendVote"("createdAt");

ALTER TABLE "LegendVote"
ADD CONSTRAINT "LegendVote_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
