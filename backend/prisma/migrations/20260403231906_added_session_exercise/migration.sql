/*
  Warnings:

  - You are about to drop the column `sessionId` on the `Exercise` table. All the data in the column will be lost.
  - You are about to drop the column `exerciseId` on the `Set` table. All the data in the column will be lost.
  - Added the required column `sessionExerciseId` to the `Set` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "SessionExercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    CONSTRAINT "SessionExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SessionExercise_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "muscleGroupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Exercise_muscleGroupId_fkey" FOREIGN KEY ("muscleGroupId") REFERENCES "MuscleGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Exercise" ("id", "isCustom", "muscleGroupId", "name") SELECT "id", "isCustom", "muscleGroupId", "name" FROM "Exercise";
DROP TABLE "Exercise";
ALTER TABLE "new_Exercise" RENAME TO "Exercise";
CREATE TABLE "new_Set" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionExerciseId" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "reps" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'lb',
    CONSTRAINT "Set_sessionExerciseId_fkey" FOREIGN KEY ("sessionExerciseId") REFERENCES "SessionExercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Set" ("id", "reps", "unit", "weight") SELECT "id", "reps", "unit", "weight" FROM "Set";
DROP TABLE "Set";
ALTER TABLE "new_Set" RENAME TO "Set";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
