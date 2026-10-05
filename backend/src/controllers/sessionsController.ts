import express from "express";
import {
  getSession,
  getUserSessions,
  createSession,
  completeSession,
  getUserPersonalRecords,
  getUserMuscleVolume,
  getUserExerciseProgress,
  getUserExerciseStats,
  getUserExerciseHistory,
} from "../services/sessionsService.js";
import {
  authMiddleware,
  type AuthRequest,
} from "../middleware/authMiddleware.js";
import { prisma } from "../prisma.js";
import { getSessionOwnerId } from "../repositories/databaseRepository.js";
import { sendServerError } from "../utils/errorResponse.js";

export const sessionsRouter = express.Router();

// Free users only get the last 90 days of history.
const FREE_HISTORY_DAYS = 90;
const freeHistoryCutoff = () =>
  new Date(Date.now() - FREE_HISTORY_DAYS * 24 * 60 * 60 * 1000);

// GET /api/sessions/me/records
sessionsRouter.get(
  "/me/records",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const records = await getUserPersonalRecords(userId);
      return res.status(200).json(records);
    } catch (error) {
      return sendServerError(res, error);
    }
  },
);

// GET /api/sessions/me/streak
sessionsRouter.get(
  "/me/streak",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;

      // Check week by week going backwards
      let streak = 0;
      const now = new Date();

      // Start from current week's Monday
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diff);
      monday.setHours(0, 0, 0, 0);

      // Check current week first
      const currentWeekSessions = await getUserSessions(userId, monday, now);
      const currentWithSets = currentWeekSessions.filter((s) =>
        s.sessionExercises.some((se) => se.sets.length > 0),
      );
      if (currentWithSets.length > 0) {
        streak++;
      }

      // Then check previous weeks
      let checkMonday = new Date(monday);
      while (true) {
        const prevMonday = new Date(checkMonday);
        prevMonday.setDate(checkMonday.getDate() - 7);
        const prevSunday = new Date(checkMonday);
        prevSunday.setMilliseconds(-1);

        const sessions = await getUserSessions(userId, prevMonday, prevSunday);
        const withSets = sessions.filter((s) =>
          s.sessionExercises.some((se) => se.sets.length > 0),
        );
        if (withSets.length === 0) break;

        streak++;
        checkMonday = prevMonday;
      }

      return res.status(200).json({ streak });
    } catch (error) {
      return sendServerError(res, error);
    }
  },
);

// GET /api/sessions/me?start=...&end=...
sessionsRouter.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    let start = req.query.start
      ? new Date(req.query.start as string)
      : new Date(0);
    const end = req.query.end ? new Date(req.query.end as string) : new Date();

    // Free users are limited to the last 90 days of history — enforced here
    // so a hand-edited request can't bypass the frontend's own date filter.
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.isPro) {
      const cutoff = freeHistoryCutoff();
      const requestedStart = start;
      if (start < cutoff) start = cutoff;

      // History opts in to also listing older sessions (so free users can
      // see what Pro would unlock), but only as bare stubs — no id, no
      // exercises, no sets — so nothing beyond the date and muscle group
      // ever leaves the server and they can't be opened from the client.
      // Opt-in so every other caller of this route keeps getting only real,
      // fully-loaded sessions.
      if (req.query.includeLocked === "true" && requestedStart < cutoff) {
        const sessions = await getUserSessions(userId, start, end);
        const lockedSessions = await prisma.session.findMany({
          where: {
            userId,
            completed: true,
            date: { gte: requestedStart, lt: cutoff },
            sessionExercises: {
              some: {
                sets: { some: { OR: [{ weight: { gt: 0 } }, { reps: { gt: 0 } }] } },
              },
            },
          },
          select: { date: true, muscleGroup: true },
        });

        return res.status(200).json([
          ...sessions,
          ...lockedSessions.map((s, i) => ({
            id: `locked-${i}`,
            muscleGroup: s.muscleGroup,
            date: s.date,
            completed: true,
            durationMinutes: null,
            sessionExercises: [],
            locked: true,
          })),
        ]);
      }
    }

    const sessions = await getUserSessions(userId, start, end);
    return res.status(200).json(sessions);
  } catch (error) {
    return sendServerError(res, error);
  }
});

// GET /api/sessions/me/volume
sessionsRouter.get(
  "/me/volume",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const volume = await getUserMuscleVolume(userId);
      return res.status(200).json(volume);
    } catch (error) {
      return sendServerError(res, error);
    }
  },
);

// GET /api/sessions/me/progress/:exerciseId
sessionsRouter.get(
  "/me/progress/:exerciseId",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const exerciseId = req.params.exerciseId as string;
      const progress = await getUserExerciseProgress(userId, exerciseId);
      return res.status(200).json(progress);
    } catch (error) {
      return sendServerError(res, error);
    }
  },
);

// GET /api/sessions/me/exercise-stats
sessionsRouter.get(
  "/me/exercise-stats",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const stats = await getUserExerciseStats(userId);
      return res.status(200).json(stats);
    } catch (error) {
      return sendServerError(res, error);
    }
  },
);

// GET /api/sessions/me/exercise-history/:exerciseId
sessionsRouter.get(
  "/me/exercise-history/:exerciseId",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const exerciseId = req.params.exerciseId as string;
      const history = await getUserExerciseHistory(userId, exerciseId);
      return res.status(200).json(history);
    } catch (error) {
      return sendServerError(res, error);
    }
  },
);

// DELETE /api/sessions/:sessionId
sessionsRouter.delete(
  "/:sessionId",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const sessionId = req.params.sessionId as string;
      const ownerId = await getSessionOwnerId(sessionId);
      if (ownerId !== req.userId!) {
        return res.status(404).json({ error: "Session introuvable" });
      }

      await prisma.set.deleteMany({
        where: { sessionExercise: { sessionId } },
      });
      await prisma.sessionExercise.deleteMany({
        where: { sessionId },
      });
      await prisma.session.delete({
        where: { id: sessionId },
      });

      return res.status(200).json({ message: "Session supprimée" });
    } catch (error) {
      return sendServerError(res, error);
    }
  },
);

// GET /api/sessions/:sessionId
sessionsRouter.get(
  "/:sessionId",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const sessionId = req.params.sessionId as string;
      const ownerId = await getSessionOwnerId(sessionId);
      if (ownerId !== req.userId!) {
        return res.status(404).json({ error: "Session introuvable" });
      }
      const session = await getSession(sessionId);
      if (!session) return res.status(404).json({ error: "Session introuvable" });

      // Same 90-day limit as GET /me, so an old session's id (e.g. from the
      // exercise history list) can't be used to read it directly. Unfinished
      // sessions stay reachable whatever their age so they can still be
      // resumed or closed out.
      if (session.completed && session.date < freeHistoryCutoff()) {
        const user = await prisma.user.findUnique({ where: { id: req.userId! } });
        if (!user?.isPro) {
          return res
            .status(403)
            .json({ error: "Historique réservé Pro", proRequired: true });
        }
      }

      return res.status(200).json(session);
    } catch (error) {
      return sendServerError(res, error);
    }
  },
);

// POST /api/sessions
sessionsRouter.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const payload = req.body;
    if (!payload.muscleGroup)
      return res.status(400).json({ error: "Groupe musculaire requis" });
    const session = await createSession({
      ...payload,
      userId: req.userId!,
    });
    return res.status(201).json(session);
  } catch (error) {
    return sendServerError(res, error);
  }
});

// PATCH /api/sessions/:sessionId/complete
sessionsRouter.patch(
  "/:sessionId/complete",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const sessionId = req.params.sessionId as string;
      const ownerId = await getSessionOwnerId(sessionId);
      if (ownerId !== req.userId!) {
        return res.status(404).json({ error: "Session introuvable" });
      }
      const rawDuration = req.body?.durationMinutes;
      const durationMinutes =
        typeof rawDuration === "number" && Number.isFinite(rawDuration)
          ? Math.max(0, Math.round(rawDuration))
          : undefined;
      const session = await completeSession(sessionId, durationMinutes);
      return res.status(200).json(session);
    } catch (error) {
      return sendServerError(res, error);
    }
  },
);
