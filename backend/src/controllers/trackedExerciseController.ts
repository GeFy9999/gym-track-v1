import express from "express";
import {
  getTrackedExercises,
  addTrackedExercise,
  removeTrackedExercise,
} from "../repositories/databaseRepository.js";
import {
  authMiddleware,
  type AuthRequest,
} from "../middleware/authMiddleware.js";

export const trackedExerciseRouter = express.Router();

trackedExerciseRouter.get(
  "/",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const tracked = await getTrackedExercises(userId);
      return res.status(200).json(tracked);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: message });
    }
  },
);

trackedExerciseRouter.post(
  "/",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { exerciseId } = req.body;

      if (!exerciseId) {
        return res.status(400).json({ error: "exerciseId requis" });
      }

      const tracked = await addTrackedExercise(userId, exerciseId);
      return res.status(201).json(tracked);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json({ error: message });
    }
  },
);

trackedExerciseRouter.delete(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const id = req.params.id as string;
      await removeTrackedExercise(id);
      return res.status(200).json({ message: "Exercice retiré" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: message });
    }
  },
);
