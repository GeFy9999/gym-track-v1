import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import {
  getUserByEmail,
  insertUser,
} from "../repositories/databaseRepository.js";
import { prisma } from "../prisma.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const register = async (payload: {
  email: string;
  password: string;
  name: string;
}) => {
  const existing = await getUserByEmail(payload.email);
  if (existing) throw new Error("Email déjà utilisé");

  const hashed = await bcrypt.hash(payload.password, 10);
  const user = await insertUser({
    email: payload.email,
    password: hashed,
    name: payload.name,
  });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      recoveryEmail: user.recoveryEmail,
      weightUnit: user.weightUnit,
      authProvider: user.authProvider,
    },
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
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      recoveryEmail: user.recoveryEmail,
      weightUnit: user.weightUnit,
      authProvider: user.authProvider,
    },
  };
};

export const googleLogin = async (credential: string) => {
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
    });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      recoveryEmail: user.recoveryEmail,
      weightUnit: user.weightUnit,
      authProvider: user.authProvider,
    },
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
