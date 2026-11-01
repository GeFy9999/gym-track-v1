-- CreateTable
CREATE TABLE "ExercisePreset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "muscleGroup" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExercisePreset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExercisePresetItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "presetId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "ExercisePresetItem_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "ExercisePreset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExercisePresetItem_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ExercisePreset_userId_muscleGroup_idx" ON "ExercisePreset"("userId", "muscleGroup");

-- CreateIndex
CREATE INDEX "ExercisePresetItem_presetId_idx" ON "ExercisePresetItem"("presetId");

-- CreateIndex
CREATE INDEX "ExercisePresetItem_exerciseId_idx" ON "ExercisePresetItem"("exerciseId");

