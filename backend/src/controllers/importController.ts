import express from "express";
import { importWorkouts, undoImportBatch } from "../services/importService.js";
import {
  authMiddleware,
  type AuthRequest,
} from "../middleware/authMiddleware.js";

export const importRouter = express.Router();

// POST /api/import — bulk-create sessions/exercises/sets from a parsed CSV import
importRouter.post("", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { workouts } = req.body;
    const result = await importWorkouts(userId, workouts);
    return res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(400).json({ error: message });
  }
});

// DELETE /api/import/:importBatchId — undo an import (removes every session it created)
importRouter.delete(
  "/:importBatchId",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const importBatchId = req.params.importBatchId as string;
      const count = await undoImportBatch(userId, importBatchId);
      return res.status(200).json({ sessionsDeleted: count });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: message });
    }
  },
);
