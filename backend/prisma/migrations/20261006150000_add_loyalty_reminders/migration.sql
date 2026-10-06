-- AlterTable
ALTER TABLE "User" ADD COLUMN "loyaltyLastRenewalAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "loyaltyReminder1For" TEXT;
ALTER TABLE "User" ADD COLUMN "loyaltyReminder2For" TEXT;
