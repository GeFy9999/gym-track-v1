import express from "express";
import {
  createExercise,
  getExercises,
  getExercisesForMuscleGroup,
} from "../services/exercisesService.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { sendServerError } from "../utils/errorResponse.js";

export const exercisesRouter = express.Router();

exercisesRouter.get("", async (req, res) => {
  try {
    const muscleGroupId = req.query.muscleGroupId as string | undefined;
    const exercises = muscleGroupId
      ? await getExercisesForMuscleGroup(muscleGroupId)
      : await getExercises();
    return res.status(200).json(exercises);
  } catch (error) {
    return sendServerError(res, error);
  }
});

exercisesRouter.post("", authMiddleware, async (req, res) => {
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
    const exercise = await createExercise(payload);
    return res.status(201).json(exercise);
  } catch (error) {
    return sendServerError(res, error);
  }
});
