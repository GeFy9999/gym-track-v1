import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import {
  getUserByEmail,
  insertUser,
} from "../repositories/databaseRepository.js";

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

  return { token, user: { id: user.id, email: user.email, name: user.name } };
};

export const login = async (payload: { email: string; password: string }) => {
  const user = await getUserByEmail(payload.email);
  if (!user) throw new Error("Email ou mot de passe incorrect");

  const valid = await bcrypt.compare(payload.password, user.password);
  if (!valid) throw new Error("Email ou mot de passe incorrect");

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  return { token, user: { id: user.id, email: user.email, name: user.name } };
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
    });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  return { token, user: { id: user.id, email: user.email, name: user.name } };
};
