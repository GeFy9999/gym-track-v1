import express from "express";
import {
  createSet,
  editSet,
  removeSet,
  getSetsBySessionExercise,
} from "../services/setsService.js";

export const setsRouter = express.Router();

// GET /api/sets/:sessionExerciseId - tous les sets d'un exercice de session
setsRouter.get("/:sessionExerciseId", async (req, res) => {
  try {
    const { sessionExerciseId } = req.params;
    const sets = await getSetsBySessionExercise(sessionExerciseId);
    return res.status(200).json(sets);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/sets - créer un set
setsRouter.post("", async (req, res) => {
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
    const set = await createSet(payload);
    return res.status(201).json(set);
  } catch (error) {
    console.error(error.message, error);
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /api/sets/:id - modifier un set
setsRouter.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const set = await editSet(id, payload);
    return res.status(200).json(set);
  } catch (error) {
    console.error(error.message, error);
    return res.status(500).json({ error: error.message });
  }
});

// DELETE /api/sets/:id - supprimer un set
setsRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await removeSet(id);
    return res.status(204).send();
  } catch (error) {
    console.error(error.message, error);
    return res.status(500).json({ error: error.message });
  }
});
