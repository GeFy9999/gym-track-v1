import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  getUserByEmail,
  insertUser,
} from "../repositories/databaseRepository.js";

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
