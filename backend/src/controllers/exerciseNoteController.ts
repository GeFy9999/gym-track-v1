import express from "express";
import {
  getExerciseNotes,
  upsertExerciseNote,
  deleteExerciseNote,
} from "../repositories/databaseRepository.js";
import {
  authMiddleware,
  type AuthRequest,
} from "../middleware/authMiddleware.js";
import { sendServerError } from "../utils/errorResponse.js";

export const exerciseNoteRouter = express.Router();

// GET /api/exercise-notes
exerciseNoteRouter.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const notes = await getExerciseNotes(userId);
    return res.status(200).json(notes);
  } catch (error) {
    return sendServerError(res, error);
  }
});

// PUT /api/exercise-notes - crée ou met à jour la note d'un exercice
exerciseNoteRouter.put("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { exerciseId, note } = req.body;

    if (!exerciseId) {
      return res.status(400).json({ error: "exerciseId requis" });
    }

    if (!note || !note.trim()) {
      await deleteExerciseNote(userId, exerciseId);
      return res.status(200).json({ message: "Note supprimée" });
    }

    const saved = await upsertExerciseNote(userId, exerciseId, note.trim());
    return res.status(200).json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(400).json({ error: message });
  }
});
