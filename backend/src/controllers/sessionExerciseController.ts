import express from "express";
import {
  addExerciseToSession,
  removeExerciseFromSession,
} from "../services/sessionExerciseService.js";

export const sessionExercisesRouter = express.Router();

// POST /api/session-exercises - ajouter un exercice à une session
sessionExercisesRouter.post("", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.sessionId) {
      return res.status(400).json("sessionId not provided");
    }
    if (!payload.exerciseId) {
      return res.status(400).json("exerciseId not provided");
    }
    const sessionExercise = await addExerciseToSession(payload);
    return res.status(201).json(sessionExercise);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    return res.status(500).json({ error: message });
  }
});

// DELETE /api/session-exercises/:id - retirer un exercice d'une session
sessionExercisesRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await removeExerciseFromSession(id);
    return res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    return res.status(500).json({ error: message });
  }
});
