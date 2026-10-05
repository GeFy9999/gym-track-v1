import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import {
  getUserByEmail,
  insertUser,
} from "../repositories/databaseRepository.js";
import { prisma } from "../prisma.js";
import { Resend } from "resend";
import {
  computeLoyaltyDiscountCents,
  googlePlayLoyaltyUpgradeProductId,
} from "../utils/loyalty.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const toPublicUser = (user: {
  id: string;
  email: string;
  name: string;
  recoveryEmail: string | null;
  weightUnit: string;
  restTimerSeconds: number;
  restTimerEnabled: boolean;
  barbellModeEnabled: boolean;
  language: string;
  authProvider: string;
  isPro: boolean;
  proCurrentPeriodEnd: Date | null;
  proInterval: string | null;
  loyaltyPeriodsPaid: number;
  billingProvider: string;
  emailVerified: boolean;
  hasUsedTrial: boolean;
  proProductId: string | null;
}) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  recoveryEmail: user.recoveryEmail,
  weightUnit: user.weightUnit,
  restTimerSeconds: user.restTimerSeconds,
  restTimerEnabled: user.restTimerEnabled,
  barbellModeEnabled: user.barbellModeEnabled,
  language: user.language,
  authProvider: user.authProvider,
  isPro: user.isPro,
  proCurrentPeriodEnd: user.proCurrentPeriodEnd,
  proInterval: user.proInterval,
  loyaltyPeriodsPaid: user.loyaltyPeriodsPaid,
  billingProvider: user.billingProvider,
  emailVerified: user.emailVerified,
  hasUsedTrial: user.hasUsedTrial,
  proProductId: user.proProductId,
  // Google Play only: the cheaper loyalty tier the subscriber has earned
  // but isn't on yet — the app offers to switch to it (see loyalty.ts).
  loyaltyUpgradeProductId: googlePlayLoyaltyUpgradeProductId(user),
  loyaltyDiscountCents: computeLoyaltyDiscountCents(
    user.loyaltyPeriodsPaid,
    user.proInterval,
  ),
});

export const register = async (payload: {
  email: string;
  password: string;
  name: string;
  language?: string;
}) => {
  const existing = await getUserByEmail(payload.email);
  if (existing) throw new Error("Email déjà utilisé");

  const hashed = await bcrypt.hash(payload.password, 10);
  const language = payload.language === "en" ? "en" : "fr";
  const verificationToken = crypto.randomUUID();
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await insertUser({
    email: payload.email,
    password: hashed,
    name: payload.name,
    // The client detects the browser's locale and passes it along so a new
    // account starts in the visitor's language instead of always "fr".
    language,
    emailVerified: false,
    verificationToken,
    verificationTokenExpiry,
  });

  await sendVerificationEmail(user.email, language, verificationToken);

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  return {
    token,
    user: toPublicUser(user),
  };
};

export const login = async (payload: { email: string; password: string }) => {
  const user = await getUserByEmail(payload.email);
  if (!user) throw new Error("Email ou mot de passe incorrect");

  const valid = await bcrypt.compare(payload.password, user.password);
  if (!valid) throw new Error("Email ou mot de passe incorrect");

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  return {
    token,
    user: toPublicUser(user),
  };
};

export const googleLogin = async (credential: string, language?: string) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID!,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error("Token Google invalide");
  }

  const email: string = payload.email;
  const name = String(payload.name || email.split("@")[0]);

  let user = await getUserByEmail(email);
  const isNewUser = !user;

  if (!user) {
    const randomPassword = await bcrypt.hash(
      String(payload.sub) + Date.now(),
      10,
    );
    user = await insertUser({
      email,
      password: randomPassword,
      name,
      authProvider: "google",
      language: language === "en" ? "en" : "fr",
      // Google has already verified this address, so skip our own
      // verification email entirely for this signup path.
      emailVerified: true,
    });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  return {
    token,
    isNewUser,
    user: toPublicUser(user),
  };
};

export const changePassword = async (
  userId: string,
  currentPassword: string | null,
  newPassword: string,
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Utilisateur introuvable");

  if (user.authProvider === "email") {
    if (!currentPassword) throw new Error("Mot de passe actuel requis");
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new Error("Mot de passe actuel incorrect");
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });
};

export const deleteAccount = async (userId: string) => {
  await prisma.set.deleteMany({
    where: { sessionExercise: { session: { userId } } },
  });
  await prisma.sessionExercise.deleteMany({
    where: { session: { userId } },
  });
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.bodyWeight.deleteMany({ where: { userId } });
  await prisma.schedule.deleteMany({ where: { userId } });
  await prisma.trackedExercise.deleteMany({ where: { userId } });
  await prisma.exerciseNote.deleteMany({ where: { userId } });
  await prisma.exerciseLoadingType.deleteMany({ where: { userId } });
  await prisma.progressPhoto.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
};

export const updateRecoveryEmail = async (
  userId: string,
  recoveryEmail: string,
) => {
  await prisma.user.update({
    where: { id: userId },
    data: { recoveryEmail },
  });
};

export const updateWeightUnit = async (userId: string, weightUnit: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Utilisateur introuvable");

  const currentUnit = user.weightUnit;
  if (currentUnit === weightUnit) return;

  const factor = weightUnit === "kg" ? 0.453592 : 2.20462;

  const sets = await prisma.set.findMany({
    where: { sessionExercise: { session: { userId } } },
  });

  for (const set of sets) {
    await prisma.set.update({
      where: { id: set.id },
      data: { weight: Math.round(set.weight * factor) },
    });
  }

  const weights = await prisma.bodyWeight.findMany({
    where: { userId },
  });

  for (const w of weights) {
    await prisma.bodyWeight.update({
      where: { id: w.id },
      data: { value: Math.round(w.value * factor) },
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { weightUnit },
  });
};

export const updateRestTimer = async (
  userId: string,
  restTimerSeconds: number,
) => {
  await prisma.user.update({
    where: { id: userId },
    data: { restTimerSeconds },
  });
};

export const updateRestTimerEnabled = async (
  userId: string,
  restTimerEnabled: boolean,
) => {
  await prisma.user.update({
    where: { id: userId },
    data: { restTimerEnabled },
  });
};

export const updateLanguage = async (userId: string, language: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: { language },
  });
};

export const updateBarbellModeEnabled = async (
  userId: string,
  barbellModeEnabled: boolean,
) => {
  await prisma.user.update({
    where: { id: userId },
    data: { barbellModeEnabled },
  });
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Utilisateur introuvable");

  return toPublicUser(user);
};

// There's no HTTP request context for this email (it's sent from an async
// background flow, not a page render), so the language can't come from a
// browser header — it has to come from the user's saved DB preference.
const RESET_EMAIL_CONTENT = {
  fr: {
    subject: "Réinitialiser ton mot de passe — GymsTrack",
    heading: "Réinitialisation du mot de passe",
    body: "Clique sur le lien ci-dessous pour réinitialiser ton mot de passe :",
    button: "Réinitialiser mon mot de passe",
    expiry: "Ce lien expire dans 1 heure.",
    ignore: "Si tu n'as pas demandé cette réinitialisation, ignore ce courriel.",
  },
  en: {
    subject: "Reset your password — GymsTrack",
    heading: "Password reset",
    body: "Click the link below to reset your password:",
    button: "Reset my password",
    expiry: "This link expires in 1 hour.",
    ignore: "If you didn't request this reset, just ignore this email.",
  },
} as const;

export const forgotPassword = async (email: string) => {
  const user = await getUserByEmail(email);
  // Deliberately silent no-op for an unknown email — responding differently
  // here would let an attacker enumerate which emails have an account.
  if (!user) return;

  const token = crypto.randomUUID();
  const expiry = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  const content = RESET_EMAIL_CONTENT[user.language === "en" ? "en" : "fr"];

  await resend.emails.send({
    from: "GymsTrack <noreply@gymstrack.com>",
    to: email,
    subject: content.subject,
    html: `
      <h2>${content.heading}</h2>
      <p>${content.body}</p>
      <a href="${resetUrl}" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
        ${content.button}
      </a>
      <p style="color:#888;margin-top:16px;">${content.expiry}</p>
      <p style="color:#888;">${content.ignore}</p>
    `,
  });
};

export const resetPassword = async (token: string, newPassword: string) => {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) throw new Error("Lien expiré ou invalide");

  const samePassword = await bcrypt.compare(newPassword, user.password);
  if (samePassword)
    throw new Error("Le nouveau mot de passe doit être différent de l'ancien");

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });
};

const VERIFICATION_EMAIL_CONTENT = {
  fr: {
    subject: "Confirme ton adresse courriel — GymsTrack",
    heading: "Bienvenue sur GymsTrack !",
    body: "Clique sur le bouton ci-dessous pour confirmer ton adresse courriel et activer ton compte :",
    button: "Confirmer mon courriel",
    expiry: "Ce lien expire dans 24 heures.",
    ignore: "Si tu n'as pas créé de compte GymsTrack, ignore ce courriel.",
  },
  en: {
    subject: "Confirm your email — GymsTrack",
    heading: "Welcome to GymsTrack!",
    body: "Click the button below to confirm your email address and activate your account:",
    button: "Confirm my email",
    expiry: "This link expires in 24 hours.",
    ignore: "If you didn't create a GymsTrack account, just ignore this email.",
  },
} as const;

const sendVerificationEmail = async (
  email: string,
  language: string,
  verificationToken: string,
) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  const content = VERIFICATION_EMAIL_CONTENT[language === "en" ? "en" : "fr"];

  await resend.emails.send({
    from: "GymsTrack <noreply@gymstrack.com>",
    to: email,
    subject: content.subject,
    html: `
      <h2>${content.heading}</h2>
      <p>${content.body}</p>
      <a href="${verifyUrl}" style="display:inline-block;background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
        ${content.button}
      </a>
      <p style="color:#888;margin-top:16px;">${content.expiry}</p>
      <p style="color:#888;">${content.ignore}</p>
    `,
  });
};

export const verifyEmail = async (token: string) => {
  const user = await prisma.user.findFirst({
    where: {
      verificationToken: token,
      verificationTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) throw new Error("Lien expiré ou invalide");

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    },
  });

  const jwtToken = jwt.sign({ userId: updated.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  return {
    token: jwtToken,
    user: toPublicUser(updated),
  };
};

export const resendVerificationEmail = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Utilisateur introuvable");
  if (user.emailVerified) return;

  const verificationToken = crypto.randomUUID();
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken, verificationTokenExpiry },
  });

  await sendVerificationEmail(user.email, user.language, verificationToken);
};
