import express from "express";
import {
  authMiddleware,
  type AuthRequest,
} from "../middleware/authMiddleware.js";
import { prisma } from "../prisma.js";
import { sendServerError } from "../utils/errorResponse.js";

export const exerciseLoadingTypeRouter = express.Router();

export const LOADING_TYPES = [
  "BARBELL",
  "PLATE_LOADED",
  "DUMBBELL",
  "MACHINE",
  "CABLE",
  "BODYWEIGHT",
  "ASSISTED",
] as const;

// GET /api/exercise-loading-types - the user's own per-exercise choices
exerciseLoadingTypeRouter.get(
  "/",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const overrides = await prisma.exerciseLoadingType.findMany({
        where: { userId: req.userId! },
        select: { exerciseId: true, loadingType: true },
      });
      return res.status(200).json(overrides);
    } catch (error) {
      return sendServerError(res, error);
    }
  },
);

// PUT /api/exercise-loading-types - sets (or, with loadingType: null,
// resets to automatic) the user's loading type for one exercise. Pro-only,
// like the rest of the loading-type inputs.
exerciseLoadingTypeRouter.put(
  "/",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { exerciseId, loadingType } = req.body ?? {};

      if (typeof exerciseId !== "string" || !exerciseId) {
        return res.status(400).json({ error: "exerciseId requis" });
      }
      if (
        loadingType !== null &&
        !LOADING_TYPES.includes(loadingType as (typeof LOADING_TYPES)[number])
      ) {
        return res.status(400).json({ error: "loadingType invalide" });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.isPro) {
        return res
          .status(403)
          .json({ error: "Fonctionnalité Pro", proRequired: true });
      }

      const exercise = await prisma.exercise.findUnique({
        where: { id: exerciseId },
      });
      if (!exercise) {
        return res.status(404).json({ error: "Exercice introuvable" });
      }

      if (loadingType === null) {
        await prisma.exerciseLoadingType.deleteMany({
          where: { userId, exerciseId },
        });
        return res.status(200).json({ exerciseId, loadingType: null });
      }

      const saved = await prisma.exerciseLoadingType.upsert({
        where: { userId_exerciseId: { userId, exerciseId } },
        create: { userId, exerciseId, loadingType },
        update: { loadingType },
        select: { exerciseId: true, loadingType: true },
      });
      return res.status(200).json(saved);
    } catch (error) {
      return sendServerError(res, error);
    }
  },
);
