import express from "express";
import {
  register,
  login,
  googleLogin,
  changePassword,
  deleteAccount,
  updateRecoveryEmail,
  updateWeightUnit,
  forgotPassword,
  resetPassword,
} from "../services/authService.js";
import {
  authMiddleware,
  type AuthRequest,
} from "../middleware/authMiddleware.js";

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

// POST /api/auth/change-password
authRouter.post(
  "/change-password",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ error: "Les deux mots de passe sont requis" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          error: "Le nouveau mot de passe doit contenir au moins 8 caractères",
        });
      }

      await changePassword(userId, currentPassword, newPassword);
      return res.status(200).json({ message: "Mot de passe modifié" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json({ error: message });
    }
  },
);

// DELETE /api/auth/delete-account
authRouter.delete(
  "/delete-account",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      await deleteAccount(userId);
      return res.status(200).json({ message: "Compte supprimé" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: message });
    }
  },
);

// PATCH /api/auth/recovery-email
authRouter.patch(
  "/recovery-email",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { recoveryEmail } = req.body;

      if (!recoveryEmail) {
        return res.status(400).json({ error: "Courriel requis" });
      }

      await updateRecoveryEmail(userId, recoveryEmail);
      return res
        .status(200)
        .json({ message: "Courriel de récupération mis à jour" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json({ error: message });
    }
  },
);

// PATCH /api/auth/weight-unit
authRouter.patch(
  "/weight-unit",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { weightUnit } = req.body;

      if (!weightUnit || !["lb", "kg"].includes(weightUnit)) {
        return res.status(400).json({ error: "Unité invalide (lb ou kg)" });
      }

      await updateWeightUnit(userId, weightUnit);
      return res.status(200).json({ message: "Unité mise à jour" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json({ error: message });
    }
  },
);

// POST /api/auth/forgot-password
authRouter.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Courriel requis" });

    await forgotPassword(email);
    return res.status(200).json({ message: "Courriel envoyé" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(400).json({ error: message });
  }
});

// POST /api/auth/reset-password
authRouter.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token et mot de passe requis" });
    }

    await resetPassword(token, newPassword);
    return res.status(200).json({ message: "Mot de passe réinitialisé" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(400).json({ error: message });
  }
});
