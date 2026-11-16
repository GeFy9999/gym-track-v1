// One-off notice of the 2026-11-15 update of the Terms of Service and the
// Privacy Policy, to the accounts that existed before it (the Terms promise
// to tell users about significant changes "in the app or by email").
// Informational: nothing to accept, no unsubscribe needed (a service notice
// about their account, not marketing).
//
// Run on the server, where the production database is:
//   npx tsx scripts/send-terms-update-email.ts
//       Dry run: counts the recipients, sends nothing.
//   npx tsx scripts/send-terms-update-email.ts --test you@example.com [fr|en]
//       Sends one sample to that address only.
//   npx tsx scripts/send-terms-update-email.ts --send
//       Sends to every recipient. Re-runnable: addresses already sent to are
//       listed in terms-update-2026-11-sent.json and skipped.
//
// Recipients: verified accounts created before --before (default: the day
// after the update, 2026-11-16) — people who signed up later already
// accepted the new versions.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { Resend } from "resend";
import { prisma } from "../src/prisma.js";

const SENT_LOG = "terms-update-2026-11-sent.json";
const SITE = "https://gymstrack.app";
// Resend's default limit is 2 requests per second.
const DELAY_MS = 600;

const CONTENT = {
  fr: {
    subject: "Mise à jour de nos conditions et de notre politique de confidentialité",
    hello: (name: string) => (name ? `Bonjour ${name},` : "Bonjour,"),
    intro:
      "Nous avons mis à jour nos conditions d'utilisation et notre politique de confidentialité le 15 novembre 2026. Voici ce qui change :",
    points: [
      "<strong>Statistiques d'utilisation anonymes, seulement si tu les acceptes.</strong> Elles nous aident à savoir quoi améliorer. Jamais ton nom, ton courriel ni le contenu de tes séances. Tu peux changer d'avis à tout moment dans Paramètres → Confidentialité.",
      "<strong>Rapports d'erreur</strong> quand l'app plante, pour corriger les bugs plus vite, sans ton nom, ton courriel ni le contenu de tes séances.",
      "<strong>Une question facultative</strong> au premier lancement de l'app : comment tu as connu GymsTrack.",
      "Nous te préviendrons en cas de changement important de ces documents.",
    ],
    nothingToDo:
      "Rien ne change pour ton abonnement ni pour tes données d'entraînement, et tu n'as rien à faire. Si tu n'es pas d'accord avec ces nouvelles versions, tu peux supprimer ton compte à tout moment dans Paramètres.",
    terms: "Conditions d'utilisation",
    privacy: "Politique de confidentialité",
    footer:
      "Tu reçois ce courriel parce que tu as un compte GymsTrack. Une question ? Réponds simplement à ce courriel.",
  },
  en: {
    subject: "Update to our Terms and Privacy Policy",
    hello: (name: string) => (name ? `Hi ${name},` : "Hi,"),
    intro:
      "We updated our Terms of Service and our Privacy Policy on November 15, 2026. Here's what changes:",
    points: [
      "<strong>Anonymous usage statistics, only if you agree to them.</strong> They help us know what to improve. Never your name, email or the content of your workouts. You can change your mind anytime in Settings → Privacy.",
      "<strong>Error reports</strong> when the app crashes, to fix bugs faster, without your name, email or the content of your workouts.",
      "<strong>An optional question</strong> when the app is first opened: how you heard about GymsTrack.",
      "We'll let you know about any significant change to these documents.",
    ],
    nothingToDo:
      "Nothing changes for your subscription or your workout data, and there's nothing you need to do. If you don't agree with these new versions, you can delete your account anytime in Settings.",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    footer:
      "You're getting this email because you have a GymsTrack account. Questions? Just reply to this email.",
  },
} as const;

type Lang = keyof typeof CONTENT;

function buildEmail(to: string, name: string, lang: Lang) {
  const c = CONTENT[lang];
  const termsUrl = `${SITE}/${lang}/terms`;
  const privacyUrl = `${SITE}/${lang}/privacy`;
  const logoUrl = `${process.env.FRONTEND_URL ?? "https://gymstrack.com"}/email-logo.png`;
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const stripTags = (html: string) => html.replace(/<[^>]+>/g, "");

  const html = `<!doctype html>
<html lang="${lang}">
  <body style="margin:0;padding:24px;background:#faf6f1;font-family:Arial,Helvetica,sans-serif;color:#191714;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px;">
      <div style="text-align:center;margin:0 0 20px;">
        <img src="${logoUrl}" width="160" height="48" alt="GymsTrack" style="display:inline-block;border:0;margin:0 auto;" />
      </div>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">${escape(c.hello(name))}</p>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">${c.intro}</p>
      <ul style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.5;">
        ${c.points.map((p) => `<li style="margin:0 0 8px;">${p}</li>`).join("\n        ")}
      </ul>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.5;">${c.nothingToDo}</p>
      <p style="margin:0;font-size:15px;line-height:1.5;">
        <a href="${termsUrl}" style="color:#c9552c;font-weight:bold;">${c.terms}</a>
        &nbsp;·&nbsp;
        <a href="${privacyUrl}" style="color:#c9552c;font-weight:bold;">${c.privacy}</a>
      </p>
    </div>
    <p style="max-width:520px;margin:16px auto 0;font-size:12px;line-height:1.5;color:#888;">${c.footer}</p>
  </body>
</html>`;

  const text = [
    c.hello(name),
    "",
    c.intro,
    "",
    ...c.points.map((p) => `- ${stripTags(p)}`),
    "",
    c.nothingToDo,
    "",
    `${c.terms} : ${termsUrl}`,
    `${c.privacy} : ${privacyUrl}`,
    "",
    "--",
    c.footer,
  ].join("\n");

  return { to, subject: c.subject, html, text };
}

const resend = new Resend(process.env.RESEND_API_KEY);

async function send(email: ReturnType<typeof buildEmail>) {
  const { error } = await resend.emails.send({
    from: "GymsTrack <noreply@gymstrack.com>",
    replyTo: "support@gymstrack.com",
    ...email,
  });
  if (error) throw new Error(`${error.name}: ${error.message}`);
}

function readSentLog(): Set<string> {
  if (!existsSync(SENT_LOG)) return new Set();
  return new Set(JSON.parse(readFileSync(SENT_LOG, "utf8")) as string[]);
}

async function main() {
  const args = process.argv.slice(2);
  const beforeArg = args[args.indexOf("--before") + 1];
  const before = new Date(args.includes("--before") ? beforeArg! : "2026-11-16T00:00:00-05:00");
  if (Number.isNaN(before.getTime())) throw new Error("Invalid --before date");

  if (args.includes("--test")) {
    const to = args[args.indexOf("--test") + 1];
    const lang: Lang = args[args.indexOf("--test") + 2] === "en" ? "en" : "fr";
    if (!to || !to.includes("@")) throw new Error("Usage: --test you@example.com [fr|en]");
    if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
    await send(buildEmail(to, "", lang));
    console.log(`✅ Sample (${lang}) sent to ${to}`);
    return;
  }

  const users = await prisma.user.findMany({
    where: { emailVerified: true, createdAt: { lt: before } },
    select: { email: true, name: true, language: true },
    orderBy: { createdAt: "asc" },
  });
  const sent = readSentLog();
  const pending = users.filter((u) => !sent.has(u.email));
  const fr = pending.filter((u) => u.language !== "en").length;

  console.log(
    `${users.length} verified account(s) created before ${before.toISOString()}; ` +
      `${sent.size} already sent; ${pending.length} to send (${fr} fr, ${pending.length - fr} en).`,
  );

  if (!args.includes("--send")) {
    console.log("Dry run — nothing sent. Add --send to send them.");
    return;
  }
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");

  let failed = 0;
  for (const [i, user] of pending.entries()) {
    const lang: Lang = user.language === "en" ? "en" : "fr";
    try {
      await send(buildEmail(user.email, user.name, lang));
      sent.add(user.email);
      writeFileSync(SENT_LOG, JSON.stringify([...sent], null, 2));
      console.log(`[${i + 1}/${pending.length}] ✅ ${user.email}`);
    } catch (err) {
      failed++;
      console.error(`[${i + 1}/${pending.length}] ❌ ${user.email}: ${(err as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log(`Done: ${pending.length - failed} sent, ${failed} failed (re-run --send to retry them).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
