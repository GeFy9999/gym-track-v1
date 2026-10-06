// Sends one sample loyalty reminder email right now — to check delivery
// (inbox vs spam), the rendering, or a mail-tester.com score — without
// waiting for a real renewal. Nothing is recorded on any account.
//
// Run with:
//   npx tsx scripts/send-test-loyalty-reminder.ts you@example.com
//   npx tsx scripts/send-test-loyalty-reminder.ts you@example.com first en
//     2nd arg: "first" (day after renewal) or "final" (2 days before, default)
//     3rd arg: "fr" (default) or "en"
import { prisma } from "../src/prisma.js";
import {
  buildReminderEmail,
  sendWithResend,
  type ReminderKind,
} from "../src/services/loyaltyReminders.js";

async function main() {
  const [to, kindArg = "final", lang = "fr"] = process.argv.slice(2);
  if (!to || !to.includes("@")) {
    throw new Error("Usage: npx tsx scripts/send-test-loyalty-reminder.ts <email> [first|final] [fr|en]");
  }
  const kind: ReminderKind = kindArg === "first" ? "first" : "final";

  // A real account for that address gets a working unsubscribe link.
  const account = await prisma.user.findUnique({ where: { email: to } });
  const email = buildReminderEmail(
    {
      id: account?.id ?? "test-recipient",
      email: to,
      language: lang === "en" ? "en" : "fr",
      proInterval: "month",
      loyaltyPeriodsPaid: 3,
    },
    kind,
  );

  await sendWithResend(email);
  console.log(`✅ Sent the "${kind}" reminder (${lang}) to ${to}: "${email.subject}"`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
