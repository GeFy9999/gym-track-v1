-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Set" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionExerciseId" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "reps" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'lb',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Set_sessionExerciseId_fkey" FOREIGN KEY ("sessionExerciseId") REFERENCES "SessionExercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Set" ("id", "reps", "sessionExerciseId", "unit", "weight") SELECT "id", "reps", "sessionExerciseId", "unit", "weight" FROM "Set";
DROP TABLE "Set";
ALTER TABLE "new_Set" RENAME TO "Set";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recoveryEmail" TEXT,
    "weightUnit" TEXT NOT NULL DEFAULT 'lb',
    "restTimerSeconds" INTEGER NOT NULL DEFAULT 120,
    "restTimerEnabled" BOOLEAN NOT NULL DEFAULT true,
    "authProvider" TEXT NOT NULL DEFAULT 'email',
    "resetToken" TEXT,
    "resetTokenExpiry" DATETIME
);
INSERT INTO "new_User" ("authProvider", "createdAt", "email", "id", "name", "password", "recoveryEmail", "resetToken", "resetTokenExpiry", "restTimerSeconds", "weightUnit") SELECT "authProvider", "createdAt", "email", "id", "name", "password", "recoveryEmail", "resetToken", "resetTokenExpiry", "restTimerSeconds", "weightUnit" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
