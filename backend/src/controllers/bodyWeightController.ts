import express from "express";
import {
  insertBodyWeight,
  getBodyWeights,
} from "../repositories/databaseRepository.js";
import {
  authMiddleware,
  type AuthRequest,
} from "../middleware/authMiddleware.js";
import { error } from "node:console";

export const bodyWeightRouter = express.Router();

// POST /api/body-weight
bodyWeightRouter.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { value } = req.body;

    if (!value || typeof value !== "number") {
      return res.status(400).json({ error: "Poids requis (nombre)" });
    }

    const entry = await insertBodyWeight({ userId, value });
    return res.status(201).json(entry);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// GET /api/body-weight
bodyWeightRouter.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const entries = await getBodyWeights(userId);
    return res.status(200).json(entries);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});
