import express from "express";
import { prisma } from "../prisma.js";
import { isValidUnsubscribeToken } from "../services/loyaltyReminders.js";
import { sendServerError } from "../utils/errorResponse.js";

export const emailRouter = express.Router();

const PAGE = {
  fr: {
    done: "C'est noté : tu ne recevras plus les rappels de réduction de fidélité par courriel. Ta réduction reste disponible dans l'app (Profil).",
    invalid: "Ce lien de désabonnement n'est pas valide.",
  },
  en: {
    done: "Done: you won't get loyalty discount reminder emails anymore. Your discount is still available in the app (Profile).",
    invalid: "This unsubscribe link isn't valid.",
  },
};

async function optOut(uid: unknown, token: unknown) {
  if (typeof uid !== "string" || typeof token !== "string") return null;
  if (!isValidUnsubscribeToken(uid, token)) return null;
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) return null;
  await prisma.user.update({ where: { id: uid }, data: { loyaltyEmailsOptOut: true } });
  return user;
}

// GET: the "unsubscribe" link in the email footer — answers with a page.
emailRouter.get("/unsubscribe/loyalty", async (req, res) => {
  try {
    const user = await optOut(req.query.uid, req.query.token);
    const text = PAGE[user?.language === "en" ? "en" : "fr"];
    res
      .status(user ? 200 : 400)
      .type("html")
      .send(
        `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GymsTrack</title></head>` +
          `<body style="font-family:Arial,Helvetica,sans-serif;background:#faf6f1;color:#191714;padding:40px 20px;">` +
          `<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;">` +
          `<p style="margin:0 0 8px;font-weight:bold;color:#c9552c;letter-spacing:1px;">GYMSTRACK</p>` +
          `<p style="margin:0;line-height:1.5;">${user ? text.done : text.invalid}</p></div></body></html>`,
      );
  } catch (error) {
    return sendServerError(res, error);
  }
});

// POST: one-click unsubscribe (RFC 8058), sent by the mail client itself
// from the List-Unsubscribe header — no page, just a status.
emailRouter.post("/unsubscribe/loyalty", async (req, res) => {
  try {
    const user = await optOut(req.query.uid, req.query.token);
    return res.status(user ? 200 : 400).json({ unsubscribed: Boolean(user) });
  } catch (error) {
    return sendServerError(res, error);
  }
});
