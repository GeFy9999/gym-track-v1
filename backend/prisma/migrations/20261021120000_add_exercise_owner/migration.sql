-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "muscleGroupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "videoUrl" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "exerciseDbId" TEXT,
    "loadingType" TEXT,
    CONSTRAINT "Exercise_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Exercise_muscleGroupId_fkey" FOREIGN KEY ("muscleGroupId") REFERENCES "MuscleGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Exercise" ("exerciseDbId", "id", "image", "isCustom", "loadingType", "muscleGroupId", "name", "videoUrl") SELECT "exerciseDbId", "id", "image", "isCustom", "loadingType", "muscleGroupId", "name", "videoUrl" FROM "Exercise";
DROP TABLE "Exercise";
ALTER TABLE "new_Exercise" RENAME TO "Exercise";
CREATE INDEX "Exercise_exerciseDbId_idx" ON "Exercise"("exerciseDbId");
CREATE INDEX "Exercise_userId_idx" ON "Exercise"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;


-- Custom exercises used to be global (visible in everyone's catalog). Give
-- each existing one to the first user who logged it in a session; a custom
-- exercise nobody ever used stays ownerless, which hides it from every
-- catalog (built-ins are isCustom = false and unaffected).
UPDATE "Exercise"
SET "userId" = (
    SELECT "s"."userId"
    FROM "SessionExercise" "se"
    JOIN "Session" "s" ON "s"."id" = "se"."sessionId"
    WHERE "se"."exerciseId" = "Exercise"."id"
    ORDER BY "s"."date" ASC
    LIMIT 1
)
WHERE "isCustom" = true;
