-- AlterTable
ALTER TABLE "Film" ADD COLUMN "posterFetchedAt" DATETIME;
ALTER TABLE "Film" ADD COLUMN "posterUrl" TEXT;
ALTER TABLE "Film" ADD COLUMN "tmdbId" INTEGER;

-- CreateIndex
CREATE INDEX "Film_tmdbId_idx" ON "Film"("tmdbId");
