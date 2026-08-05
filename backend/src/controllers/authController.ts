import express from "express";
import { register, login, googleLogin } from "../services/authService.js";

export const authRouter = express.Router();

// POST /api/auth/register
authRouter.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email) return res.status(400).json({ error: "Email requis" });
    if (!password)
      return res.status(400).json({ error: "Mot de passe requis" });
    if (!name) return res.status(400).json({ error: "Nom requis" });

    const result = await register({ email, password, name });
    return res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(400).json({ error: message });
  }
});

// POST /api/auth/login
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: "Email requis" });
    if (!password)
      return res.status(400).json({ error: "Mot de passe requis" });

    const result = await login({ email, password });
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(400).json({ error: message });
  }
});

// POST /api/auth/google
authRouter.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential)
      return res.status(400).json({ error: "Token Google requis" });

    const result = await googleLogin(credential);
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(400).json({ error: message });
  }
});
