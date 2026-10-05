-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN "loadingType" TEXT;

-- CreateTable
CREATE TABLE "ExerciseLoadingType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "loadingType" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExerciseLoadingType_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExerciseLoadingType_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseLoadingType_userId_exerciseId_key" ON "ExerciseLoadingType"("userId", "exerciseId");
