import express from "express";
import { Resend } from "resend";
import { contactLimiter } from "../middleware/rateLimiters.js";
import { sendServerError } from "../utils/errorResponse.js";

export const contactRouter = express.Router();

const TOPICS: Record<string, string> = {
  question: "Question",
  bug: "Problème / bug",
  billing: "Abonnement / paiement",
  account: "Compte / suppression",
  feedback: "Suggestion",
  other: "Autre",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

let resend: Resend | null = null;

// POST /api/contact — the marketing site's contact form. Forwards the
// message to the support inbox, with Reply-To set to the sender so
// answering is just "Reply".
contactRouter.post("/", contactLimiter, async (req, res) => {
  try {
    const { name, email, topic, message, website } = req.body ?? {};

    // Honeypot: a field real visitors never see. Bots that fill it get a
    // normal-looking success so they don't learn to skip it.
    if (typeof website === "string" && website.trim() !== "") {
      return res.status(200).json({ sent: true });
    }

    const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const fields = {
      name: clean(name),
      email: clean(email),
      topic: clean(topic),
      message: clean(message),
    };

    if (!fields.name || fields.name.length > 100) {
      return res.status(400).json({ error: "Nom requis (100 caractères max)." });
    }
    if (!EMAIL.test(fields.email) || fields.email.length > 200) {
      return res.status(400).json({ error: "Adresse courriel invalide." });
    }
    if (!TOPICS[fields.topic]) {
      return res.status(400).json({ error: "Sujet invalide." });
    }
    if (fields.message.length < 10 || fields.message.length > 5000) {
      return res
        .status(400)
        .json({ error: "Le message doit contenir entre 10 et 5000 caractères." });
    }

    const topicLabel = TOPICS[fields.topic]!;
    resend ??= new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "GymsTrack <noreply@gymstrack.com>",
      to: process.env.SUPPORT_EMAIL ?? "support@gymstrack.com",
      replyTo: fields.email,
      subject: `[Contact] ${topicLabel} — ${fields.name}`,
      text: `Nom : ${fields.name}\nCourriel : ${fields.email}\nSujet : ${topicLabel}\n\n${fields.message}`,
      html: `
        <p><strong>Nom :</strong> ${escapeHtml(fields.name)}<br />
        <strong>Courriel :</strong> ${escapeHtml(fields.email)}<br />
        <strong>Sujet :</strong> ${escapeHtml(topicLabel)}</p>
        <p style="white-space:pre-wrap;">${escapeHtml(fields.message)}</p>
      `,
    });

    return res.status(200).json({ sent: true });
  } catch (error) {
    return sendServerError(res, error);
  }
});
