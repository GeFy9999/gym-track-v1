-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recoveryEmail" TEXT,
    "weightUnit" TEXT NOT NULL DEFAULT 'lb',
    "restTimerSeconds" INTEGER NOT NULL DEFAULT 120,
    "restTimerEnabled" BOOLEAN NOT NULL DEFAULT false,
    "barbellModeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "authProvider" TEXT NOT NULL DEFAULT 'email',
    "resetToken" TEXT,
    "resetTokenExpiry" DATETIME
);
INSERT INTO "new_User" ("authProvider", "barbellModeEnabled", "createdAt", "email", "id", "name", "password", "recoveryEmail", "resetToken", "resetTokenExpiry", "restTimerEnabled", "restTimerSeconds", "weightUnit") SELECT "authProvider", "barbellModeEnabled", "createdAt", "email", "id", "name", "password", "recoveryEmail", "resetToken", "resetTokenExpiry", "restTimerEnabled", "restTimerSeconds", "weightUnit" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
