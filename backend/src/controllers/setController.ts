import express from "express";
import {
  createSet,
  editSet,
  removeSet,
  getSetsBySessionExercise,
} from "../services/setService.js";
import {
  getSessionExerciseOwnerId,
  getSetOwnerId,
} from "../repositories/databaseRepository.js";
import {
  authMiddleware,
  type AuthRequest,
} from "../middleware/authMiddleware.js";

export const setsRouter = express.Router();

// GET /api/sets/:sessionExerciseId - tous les sets d'un exercice de session
setsRouter.get(
  "/:sessionExerciseId",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const sessionExerciseId = req.params.sessionExerciseId as string;
      const ownerId = await getSessionExerciseOwnerId(sessionExerciseId);
      if (ownerId !== req.userId!) {
        return res.status(404).json({ error: "Exercice introuvable" });
      }
      const sets = await getSetsBySessionExercise(sessionExerciseId);
      return res.status(200).json(sets);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: message });
    }
  },
);

// POST /api/sets - créer un set
setsRouter.post("", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const payload = req.body;
    if (!payload.sessionExerciseId) {
      return res.status(400).json("sessionExerciseId not provided");
    }
    if (payload.weight === undefined) {
      return res.status(400).json("weight not provided");
    }
    if (payload.reps === undefined) {
      return res.status(400).json("reps not provided");
    }
    const ownerId = await getSessionExerciseOwnerId(payload.sessionExerciseId);
    if (ownerId !== req.userId!) {
      return res.status(404).json({ error: "Exercice introuvable" });
    }
    const set = await createSet(payload);
    return res.status(201).json(set);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    return res.status(500).json({ error: message });
  }
});

// PATCH /api/sets/:id - modifier un set
setsRouter.patch("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const payload = req.body;
    const ownerId = await getSetOwnerId(id);
    if (ownerId !== req.userId!) {
      return res.status(404).json({ error: "Set introuvable" });
    }
    const set = await editSet(id, payload);
    return res.status(200).json(set);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    return res.status(500).json({ error: message });
  }
});

// DELETE /api/sets/:id - supprimer un set
setsRouter.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const ownerId = await getSetOwnerId(id);
    if (ownerId !== req.userId!) {
      return res.status(404).json({ error: "Set introuvable" });
    }
    await removeSet(id);
    return res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    return res.status(500).json({ error: message });
  }
});
