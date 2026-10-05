-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN "exerciseDbId" TEXT;

-- CreateIndex
CREATE INDEX "Exercise_exerciseDbId_idx" ON "Exercise"("exerciseDbId");
