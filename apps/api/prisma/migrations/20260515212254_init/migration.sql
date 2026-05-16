-- CreateTable
CREATE TABLE "Film" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "director" TEXT NOT NULL,
    "ageBracket" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TO_WATCH',
    "notes" TEXT,
    "watchedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Film_ageBracket_idx" ON "Film"("ageBracket");

-- CreateIndex
CREATE INDEX "Film_status_idx" ON "Film"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Film_title_year_key" ON "Film"("title", "year");
