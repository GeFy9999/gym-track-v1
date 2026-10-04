// Manually flips an account's Pro status — meant for accounts that need
// Pro access without going through an actual purchase, e.g. the test
// credentials given to a Google Play reviewer.
//
// "manual" as the billing provider keeps this safely out of the way of the
// real billing webhooks: revenueCatService's EXPIRATION handler only acts
// on billingProvider === "google_play", so a stray RevenueCat event can
// never silently revoke this grant.
//
// Run with:
//   npx tsx scripts/grant-pro-access.ts reviewer@example.com
//   npx tsx scripts/grant-pro-access.ts reviewer@example.com --revoke
import { prisma } from "../src/prisma.js";

// Reviewers don't pay, so there's no real renewal date — this just needs to
// read as "not expiring any time soon" in any UI that shows it.
const FAR_FUTURE = new Date("2099-01-01");

async function main() {
  const email = process.argv[2];
  const revoke = process.argv.includes("--revoke");

  if (!email) {
    throw new Error(
      "Usage: npx tsx scripts/grant-pro-access.ts <email> [--revoke]",
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(`No user found with email "${email}"`);
  }

  if (revoke) {
    // Only clear it if we were the ones who granted it — never touch a
    // real paying subscriber's status by accident.
    if (user.billingProvider !== "manual") {
      console.log(
        `"${email}" isn't a manual grant (billingProvider: "${user.billingProvider}") — leaving it alone.`,
      );
      return;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isPro: false,
        billingProvider: "stripe",
        proCurrentPeriodEnd: null,
      },
    });
    console.log(`Revoked manual Pro access for "${email}".`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isPro: true,
      billingProvider: "manual",
      proCurrentPeriodEnd: FAR_FUTURE,
    },
  });
  console.log(`Granted Pro access to "${email}".`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
