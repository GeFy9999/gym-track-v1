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
import { sendServerError } from "../utils/errorResponse.js";
import {
  definedOnly,
  optionalBoolean,
  optionalNumber,
  optionalString,
} from "../utils/requestBody.js";

export const setsRouter = express.Router();

// A timed set's duration: whole seconds, up to a day.
const optionalDuration = (v: unknown) => {
  const n = optionalNumber(v);
  return n === undefined ? undefined : Math.min(86_400, Math.max(0, Math.round(n)));
};

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
      return sendServerError(res, error);
    }
  },
);

// POST /api/sets - créer un set
setsRouter.post("", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const body = req.body ?? {};
    const sessionExerciseId = optionalString(body.sessionExerciseId);
    const weight = optionalNumber(body.weight);
    const reps = optionalNumber(body.reps);
    if (!sessionExerciseId) {
      return res.status(400).json({ error: "sessionExerciseId requis" });
    }
    if (weight === undefined) {
      return res.status(400).json({ error: "weight requis" });
    }
    if (reps === undefined) {
      return res.status(400).json({ error: "reps requis" });
    }
    const ownerId = await getSessionExerciseOwnerId(sessionExerciseId);
    if (ownerId !== req.userId!) {
      return res.status(404).json({ error: "Exercice introuvable" });
    }
    const set = await createSet({
      sessionExerciseId,
      weight,
      reps,
      ...definedOnly({
        unit: optionalString(body.unit, 10),
        type: optionalString(body.type, 20),
        durationSeconds: optionalDuration(body.durationSeconds),
      }),
    });
    return res.status(201).json(set);
  } catch (error) {
    return sendServerError(res, error);
  }
});

// PATCH /api/sets/:id - modifier un set
setsRouter.patch("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const body = req.body ?? {};
    const ownerId = await getSetOwnerId(id);
    if (ownerId !== req.userId!) {
      return res.status(404).json({ error: "Set introuvable" });
    }
    const set = await editSet(
      id,
      definedOnly({
        weight: optionalNumber(body.weight),
        reps: optionalNumber(body.reps),
        unit: optionalString(body.unit, 10),
        completed: optionalBoolean(body.completed),
        type: optionalString(body.type, 20),
        durationSeconds: optionalDuration(body.durationSeconds),
      }),
    );
    return res.status(200).json(set);
  } catch (error) {
    return sendServerError(res, error);
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
    return sendServerError(res, error);
  }
});
