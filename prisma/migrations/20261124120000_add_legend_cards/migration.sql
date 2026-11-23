-- Store legend drafts and published cards, including an optimized image data URL.
CREATE TABLE "LegendCard" (
    "id" TEXT NOT NULL,
    "legendNumber" INTEGER NOT NULL,
    "nickname" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "achievement" TEXT NOT NULL,
    "imageData" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegendCard_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LegendCard_legendNumber_key" ON "LegendCard"("legendNumber");
