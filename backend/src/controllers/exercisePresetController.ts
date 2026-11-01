import express from "express";
import {
  authMiddleware,
  type AuthRequest,
} from "../middleware/authMiddleware.js";
import { prisma } from "../prisma.js";
import { sendServerError } from "../utils/errorResponse.js";
import { optionalString } from "../utils/requestBody.js";

export const exercisePresetRouter = express.Router();

const MAX_NAME_LENGTH = 60;
const MAX_EXERCISES = 40;
const MAX_PRESETS_PER_USER = 200;

const presetInclude = {
  items: {
    orderBy: { order: "asc" as const },
    include: {
      exercise: {
        select: {
          id: true,
          name: true,
          image: true,
          loadingType: true,
          trackingType: true,
          isCustom: true,
          userId: true,
        },
      },
    },
  },
};

type PresetRow = Awaited<
  ReturnType<typeof prisma.exercisePreset.findFirstOrThrow<{ include: typeof presetInclude }>>
>;

// Flattens the join rows into the exercise list the app works with, and
// hides another user's custom exercise (possible only through old data).
const toResponse = (preset: PresetRow, userId: string) => ({
  id: preset.id,
  name: preset.name,
  muscleGroup: preset.muscleGroup,
  exercises: preset.items
    .map((item) => item.exercise)
    .filter((ex) => !ex.isCustom || ex.userId === userId)
    .map(({ userId: _owner, ...ex }) => ex),
});

const parseName = (v: unknown) => {
  const name = optionalString(v, MAX_NAME_LENGTH)?.trim();
  return name ? name : undefined;
};

// A list of distinct exercise ids, every one visible to the user and in the
// preset's muscle group. Returns an error message when it isn't.
async function validateExerciseIds(
  value: unknown,
  muscleGroup: string,
  userId: string,
): Promise<{ ids: string[] } | { error: string }> {
  if (
    !Array.isArray(value) ||
    value.length > MAX_EXERCISES ||
    value.some((id) => typeof id !== "string")
  ) {
    return { error: `exerciseIds (string[], max ${MAX_EXERCISES}) requis` };
  }
  const ids = [...new Set(value as string[])];
  if (ids.length === 0) return { ids };
  const found = await prisma.exercise.count({
    where: {
      id: { in: ids },
      muscleGroup: { name: muscleGroup },
      OR: [{ isCustom: false }, { userId }],
    },
  });
  if (found !== ids.length) return { error: "Exercice introuvable" };
  return { ids };
}

// GET /api/exercise-presets?muscleGroup=Chest - the user's presets (of one
// muscle group when given), oldest first so "Preset 1" stays on top.
exercisePresetRouter.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const muscleGroup = optionalString(req.query.muscleGroup);
    const presets = await prisma.exercisePreset.findMany({
      where: { userId, ...(muscleGroup ? { muscleGroup } : {}) },
      orderBy: { createdAt: "asc" },
      include: presetInclude,
    });
    return res.status(200).json(presets.map((p) => toResponse(p, userId)));
  } catch (error) {
    return sendServerError(res, error);
  }
});

// POST /api/exercise-presets - { name, muscleGroup, exerciseIds }
exercisePresetRouter.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const name = parseName(req.body?.name);
    const muscleGroup = optionalString(req.body?.muscleGroup);
    if (!name) {
      return res.status(400).json({ error: "name requis" });
    }
    if (!muscleGroup) {
      return res.status(400).json({ error: "muscleGroup requis" });
    }
    const group = await prisma.muscleGroup.findUnique({
      where: { name: muscleGroup },
    });
    if (!group) {
      return res.status(404).json({ error: "Groupe musculaire introuvable" });
    }
    const count = await prisma.exercisePreset.count({ where: { userId } });
    if (count >= MAX_PRESETS_PER_USER) {
      return res.status(400).json({ error: "Trop de presets" });
    }
    const exercises = await validateExerciseIds(
      req.body?.exerciseIds ?? [],
      muscleGroup,
      userId,
    );
    if ("error" in exercises) {
      return res.status(400).json({ error: exercises.error });
    }

    const preset = await prisma.exercisePreset.create({
      data: {
        userId,
        muscleGroup,
        name,
        items: {
          create: exercises.ids.map((exerciseId, order) => ({
            exerciseId,
            order,
          })),
        },
      },
      include: presetInclude,
    });
    return res.status(201).json(toResponse(preset, userId));
  } catch (error) {
    return sendServerError(res, error);
  }
});

// PATCH /api/exercise-presets/:id - { name?, exerciseIds? }; exerciseIds
// replaces the whole list, in that order.
exercisePresetRouter.patch(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const id = req.params.id as string;
      const existing = await prisma.exercisePreset.findFirst({
        where: { id, userId },
      });
      if (!existing) {
        return res.status(404).json({ error: "Preset introuvable" });
      }

      const name =
        req.body?.name === undefined ? undefined : parseName(req.body.name);
      if (req.body?.name !== undefined && !name) {
        return res.status(400).json({ error: "name invalide" });
      }

      let ids: string[] | undefined;
      if (req.body?.exerciseIds !== undefined) {
        const exercises = await validateExerciseIds(
          req.body.exerciseIds,
          existing.muscleGroup,
          userId,
        );
        if ("error" in exercises) {
          return res.status(400).json({ error: exercises.error });
        }
        ids = exercises.ids;
      }

      const preset = await prisma.$transaction(async (tx) => {
        if (ids) {
          await tx.exercisePresetItem.deleteMany({ where: { presetId: id } });
          await tx.exercisePresetItem.createMany({
            data: ids.map((exerciseId, order) => ({
              presetId: id,
              exerciseId,
              order,
            })),
          });
        }
        return tx.exercisePreset.update({
          where: { id },
          data: name ? { name } : {},
          include: presetInclude,
        });
      });
      return res.status(200).json(toResponse(preset, userId));
    } catch (error) {
      return sendServerError(res, error);
    }
  },
);

// DELETE /api/exercise-presets/:id
exercisePresetRouter.delete(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const id = req.params.id as string;
      const result = await prisma.exercisePreset.deleteMany({
        where: { id, userId: req.userId! },
      });
      if (result.count === 0) {
        return res.status(404).json({ error: "Preset introuvable" });
      }
      return res.status(204).send();
    } catch (error) {
      return sendServerError(res, error);
    }
  },
);
