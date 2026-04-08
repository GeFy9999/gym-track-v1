import express from "express";
import { createExercise, getExercises } from "../services/exercisesService.js";

export const exercisesRouter = express.Router();

exercisesRouter.get("", async (req, res) => {
  try {
    const exercises = await getExercises();
    return res.status(200).json(exercises);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

exercisesRouter.post("", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload) {
      return res.status(400).json("payload not provided");
    }
    if (!payload.name) {
      return res.status(400).json("name not provided");
    }
    if (!payload.muscleGroupId) {
      return res.status(400).json("muscleGroupId not provided");
    }
    await createExercise(payload);
    return res.status(201);
  } catch (error) {
    console.error(error.message, error);
    return res.status(500).json({ error: error.message });
  }
});
