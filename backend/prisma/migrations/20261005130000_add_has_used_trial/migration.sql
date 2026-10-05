-- AlterTable
ALTER TABLE "User" ADD COLUMN "hasUsedTrial" BOOLEAN NOT NULL DEFAULT false;

-- Anyone who has ever had a recurring subscription (Stripe keeps the id
-- after cancellation; Google Play subscribers have an interval) has already
-- been offered their trial.
UPDATE "User" SET "hasUsedTrial" = true
WHERE "stripeSubscriptionId" IS NOT NULL
   OR "proInterval" IS NOT NULL
   OR "loyaltyPeriodsPaid" > 0;
