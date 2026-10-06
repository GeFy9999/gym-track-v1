import { createHmac, timingSafeEqual } from "crypto";
import { Resend } from "resend";
import { prisma } from "../prisma.js";
import {
  GOOGLE_PLAY_BASE_PRICE_CENTS,
  computeLoyaltyDiscountCents,
  googlePlayLoyaltyUpgradeProductId,
} from "../utils/loyalty.js";

// Reminders for Google Play subscribers who earned a cheaper loyalty tier
// but haven't activated it (Google Play can't lower their price on its own,
// see utils/loyalty.ts). Two per renewal, each sent at most once:
//   1. the day after the renewal that unlocked it;
//   2. two days before the next renewal — the last chance for it to apply.
// Only email here; the app also schedules matching phone notifications
// (frontend lib/loyaltyReminders.ts).

const DAY = 24 * 60 * 60 * 1000;
const FIRST_REMINDER_AFTER = 1 * DAY;
const FINAL_REMINDER_BEFORE = 2 * DAY;

export type ReminderKind = "first" | "final";

export type ReminderEmail = {
  to: string;
  subject: string;
  html: string;
  // Plain-text twin of the HTML: HTML-only mail is a classic spam signal.
  text: string;
  headers: Record<string, string>;
};

// One-click unsubscribe (RFC 8058) — Gmail and Yahoo expect it from senders,
// and an easy way out keeps people from hitting "report spam" instead. The
// link is signed so it can't be forged to unsubscribe someone else.
export function unsubscribeToken(userId: string): string {
  return createHmac("sha256", process.env.JWT_SECRET ?? "")
    .update(`loyalty-reminders:${userId}`)
    .digest("hex");
}

export function isValidUnsubscribeToken(userId: string, token: string): boolean {
  const expected = Buffer.from(unsubscribeToken(userId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

function unsubscribeUrl(userId: string): string {
  const base = process.env.BACKEND_URL ?? "https://api.gymstrack.com";
  return `${base}/api/email/unsubscribe/loyalty?uid=${encodeURIComponent(userId)}&token=${unsubscribeToken(userId)}`;
}

const CONTENT = {
  fr: {
    first: {
      subject: "Ta réduction GymsTrack est prête",
      heading: "Ta réduction de fidélité est prête !",
      body: (price: string) =>
        `Merci de ta fidélité ! Tu peux maintenant payer <strong>${price}</strong> au lieu du plein prix.`,
    },
    final: {
      subject: "Plus que 2 jours pour activer ta réduction",
      heading: "Ton renouvellement approche",
      body: (price: string) =>
        `Ton abonnement se renouvelle dans 2 jours. Active ta réduction maintenant pour payer <strong>${price}</strong> à ce renouvellement.`,
    },
    how: "Ouvre l'app GymsTrack → <strong>Profil</strong> → <strong>Activer ma réduction</strong>.",
    footer: "Tu reçois ce message parce que tu as un abonnement GymsTrack Pro avec une réduction de fidélité à activer.",
    unsubscribe: "Ne plus recevoir ces rappels",
    perMonth: "/mois",
    perYear: "/an",
  },
  en: {
    first: {
      subject: "Your GymsTrack discount is ready",
      heading: "Your loyalty discount is ready!",
      body: (price: string) =>
        `Thanks for sticking with us! You can now pay <strong>${price}</strong> instead of the full price.`,
    },
    final: {
      subject: "2 days left to activate your discount",
      heading: "Your renewal is coming up",
      body: (price: string) =>
        `Your subscription renews in 2 days. Activate your discount now to pay <strong>${price}</strong> at that renewal.`,
    },
    how: "Open the GymsTrack app → <strong>Profile</strong> → <strong>Activate my discount</strong>.",
    footer: "You're receiving this because you have a GymsTrack Pro subscription with a loyalty discount to activate.",
    unsubscribe: "Stop these reminders",
    perMonth: "/month",
    perYear: "/year",
  },
};

type ReminderUser = {
  id: string;
  email: string;
  language: string;
  proInterval: string | null;
  loyaltyPeriodsPaid: number;
};

export function buildReminderEmail(user: ReminderUser, kind: ReminderKind): ReminderEmail {
  const lang = user.language === "en" ? "en" : "fr";
  const c = CONTENT[lang];
  const interval = user.proInterval === "year" ? "year" : "month";
  const priceCents =
    GOOGLE_PLAY_BASE_PRICE_CENTS[interval]! -
    computeLoyaltyDiscountCents(user.loyaltyPeriodsPaid, user.proInterval);
  const amount = new Intl.NumberFormat(lang === "en" ? "en-US" : "fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(priceCents / 100);
  const price = `${amount}$${interval === "year" ? c.perYear : c.perMonth}`;

  const unsubscribe = unsubscribeUrl(user.id);
  const stripTags = (html: string) => html.replace(/<[^>]+>/g, "");

  return {
    to: user.email,
    subject: c[kind].subject,
    html: `<!doctype html>
<html lang="${lang}">
  <body style="margin:0;padding:24px;background:#faf6f1;font-family:Arial,Helvetica,sans-serif;color:#191714;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:bold;color:#c9552c;letter-spacing:1px;">GYMSTRACK</p>
      <h2 style="margin:0 0 16px;color:#23784d;">${c[kind].heading}</h2>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">${c[kind].body(price)}</p>
      <p style="margin:0;font-size:15px;line-height:1.5;">${c.how}</p>
    </div>
    <p style="max-width:520px;margin:16px auto 0;font-size:12px;line-height:1.5;color:#888;">
      ${c.footer}<br />
      <a href="${unsubscribe}" style="color:#888;">${c.unsubscribe}</a>
    </p>
  </body>
</html>`,
    text: [
      "GymsTrack",
      "",
      stripTags(c[kind].heading),
      "",
      stripTags(c[kind].body(price)),
      stripTags(c.how),
      "",
      "--",
      c.footer,
      `${c.unsubscribe} : ${unsubscribe}`,
    ].join("\n"),
    headers: {
      "List-Unsubscribe": `<${unsubscribe}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

let resend: Resend | null = null;
async function sendWithResend(email: ReminderEmail) {
  resend ??= new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    // Same authenticated domain as every other GymsTrack email (DKIM via
    // Resend), with a real address people can reply to.
    from: "GymsTrack <noreply@gymstrack.com>",
    replyTo: "support@gymstrack.com",
    ...email,
  });
}

// Sends every reminder that is due right now. Safe to run as often as
// needed: what was sent is recorded per renewal, so nothing goes out twice.
export async function sendDueLoyaltyReminders(
  now: Date = new Date(),
  send: (email: ReminderEmail) => Promise<void> = sendWithResend,
): Promise<{ first: number; final: number }> {
  const sent = { first: 0, final: 0 };

  const candidates = await prisma.user.findMany({
    where: {
      isPro: true,
      billingProvider: "google_play",
      loyaltyEmailsOptOut: false,
      loyaltyLastRenewalAt: { not: null },
      proCurrentPeriodEnd: { not: null },
    },
  });

  for (const user of candidates) {
    // Nothing to remind about: already on the best tier they've earned.
    if (!googlePlayLoyaltyUpgradeProductId(user)) continue;

    const renewalKey =
      user.loyaltyLastInvoiceId ?? user.loyaltyLastRenewalAt!.toISOString();
    const periodEnd = user.proCurrentPeriodEnd!.getTime();
    const untilRenewal = periodEnd - now.getTime();

    const finalDue =
      untilRenewal > 0 &&
      untilRenewal <= FINAL_REMINDER_BEFORE &&
      user.loyaltyReminder2For !== renewalKey;
    const firstDue =
      now.getTime() - user.loyaltyLastRenewalAt!.getTime() >= FIRST_REMINDER_AFTER &&
      user.loyaltyReminder1For !== renewalKey;

    // Both due at once (a short period, or the server was down): only the
    // final one — it says everything the first one would.
    const kind: ReminderKind | null = finalDue ? "final" : firstDue ? "first" : null;
    if (!kind) continue;

    try {
      await send(buildReminderEmail(user, kind));
    } catch (err) {
      console.error("[loyalty reminder] email failed for", user.id, err);
      continue; // try again next run
    }

    await prisma.user.update({
      where: { id: user.id },
      data:
        kind === "final"
          ? { loyaltyReminder1For: renewalKey, loyaltyReminder2For: renewalKey }
          : { loyaltyReminder1For: renewalKey },
    });
    sent[kind]++;
  }

  return sent;
}

// Checks once shortly after start, then every hour.
export function startLoyaltyReminderSchedule() {
  const run = () =>
    sendDueLoyaltyReminders()
      .then((sent) => {
        if (sent.first || sent.final) {
          console.log(`[loyalty reminder] sent ${sent.first} first, ${sent.final} final`);
        }
      })
      .catch((err) => console.error("[loyalty reminder] run failed", err));
  setTimeout(run, 60_000);
  setInterval(run, 60 * 60 * 1000);
}
