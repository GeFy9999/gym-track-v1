import express from "express";
import {
  addExerciseToSession,
  removeExerciseFromSession,
  reorderSessionExercisesForSession,
  linkExercisesToSuperset,
  unlinkExerciseFromSuperset,
} from "../services/sessionExerciseService.js";

export const sessionExercisesRouter = express.Router();

// PATCH /api/session-exercises/reorder - réordonner les exercices d'une session
sessionExercisesRouter.patch("/reorder", async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order) || order.some((id) => typeof id !== "string")) {
      return res.status(400).json({ error: "order (string[]) requis" });
    }
    await reorderSessionExercisesForSession(order);
    return res.status(200).json({ message: "Ordre mis à jour" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    return res.status(500).json({ error: message });
  }
});

// PATCH /api/session-exercises/superset - lier 2+ exercices en superset
sessionExercisesRouter.patch("/superset", async (req, res) => {
  try {
    const { exerciseIds } = req.body;
    if (
      !Array.isArray(exerciseIds) ||
      exerciseIds.length < 2 ||
      exerciseIds.some((id) => typeof id !== "string")
    ) {
      return res
        .status(400)
        .json({ error: "exerciseIds (string[], min 2) requis" });
    }
    const supersetId = await linkExercisesToSuperset(exerciseIds);
    return res.status(200).json({ supersetId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    return res.status(500).json({ error: message });
  }
});

// DELETE /api/session-exercises/:id/superset - retirer un exercice de son superset
sessionExercisesRouter.delete("/:id/superset", async (req, res) => {
  try {
    const { id } = req.params;
    await unlinkExerciseFromSuperset(id);
    return res.status(200).json({ message: "Retiré du superset" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message, error);
    return res.status(500).json({ error: message });
  }
});

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
