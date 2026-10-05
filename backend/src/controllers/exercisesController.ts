import express from "express";
import {
  createExercise,
  getExerciseGifPath,
  getExerciseThumbnailPath,
  getExercises,
  getExercisesForMuscleGroup,
} from "../services/exercisesService.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { exerciseMediaLimiter } from "../middleware/rateLimiters.js";
import { sendServerError } from "../utils/errorResponse.js";

export const exercisesRouter = express.Router();

// Signed-in only: the catalog is licensed (ExerciseDB) data and mustn't be
// freely harvestable.
exercisesRouter.get("", authMiddleware, async (req, res) => {
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

// One GIF at a time, rate limited (see exerciseMediaLimiter). These stay
// unauthenticated because they're loaded by plain <img> tags, which can't
// send the auth header.
exercisesRouter.get("/:id/gif", exerciseMediaLimiter, async (req, res) => {
  try {
    const gifPath = await getExerciseGifPath(req.params.id as string);
    if (!gifPath) {
      return res.status(404).json({ error: "Aucun GIF disponible pour cet exercice" });
    }
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", "public, max-age=604800, immutable");
    return res.sendFile(gifPath);
  } catch (error) {
    return sendServerError(res, error);
  }
});

exercisesRouter.get("/:id/thumbnail", exerciseMediaLimiter, async (req, res) => {
  try {
    const thumbPath = await getExerciseThumbnailPath(req.params.id as string);
    if (!thumbPath) {
      return res.status(404).json({ error: "Aucune miniature disponible pour cet exercice" });
    }
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", "public, max-age=604800, immutable");
    return res.sendFile(thumbPath);
  } catch (error) {
    return sendServerError(res, error);
  }
});

exercisesRouter.post("", authMiddleware, async (req, res) => {
  try {
    const payload = req.body;
    if (!payload) {
      return res.status(400).json({ error: "Payload requis" });
    }
    if (!payload.name) {
      return res.status(400).json({ error: "Nom requis" });
    }
    if (!payload.muscleGroupId) {
      return res.status(400).json({ error: "muscleGroupId requis" });
    }
    const exercise = await createExercise(payload);
    return res.status(201).json(exercise);
  } catch (error) {
    return sendServerError(res, error);
  }
});
