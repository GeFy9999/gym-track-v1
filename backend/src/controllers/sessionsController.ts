import express from "express";
import {
  getSession,
  getUserSessions,
  createSession,
  completeSession,
  getUserPersonalRecords,
  getUserMuscleVolume,
  getUserExerciseProgress,
} from "../services/sessionsService.js";
import {
  authMiddleware,
  type AuthRequest,
} from "../middleware/authMiddleware.js";
import { prisma } from "../prisma.js";

export const sessionsRouter = express.Router();

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
      const message = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: message });
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
      if (currentWeekSessions.length > 0) {
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
        if (sessions.length === 0) break;

        streak++;
        checkMonday = prevMonday;
      }

      return res.status(200).json({ streak });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: message });
    }
  },
);

// GET /api/sessions/me?start=...&end=...
sessionsRouter.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const start = req.query.start
      ? new Date(req.query.start as string)
      : new Date(0);
    const end = req.query.end ? new Date(req.query.end as string) : new Date();
    const sessions = await getUserSessions(userId, start, end);
    return res.status(200).json(sessions);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
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
      const message = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: message });
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
      const message = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ error: message });
    }
  },
);

// DELETE /api/sessions/:sessionId
sessionsRouter.delete("/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

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
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// GET /api/sessions/:sessionId
sessionsRouter.get("/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await getSession(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    return res.status(200).json(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// POST /api/sessions
sessionsRouter.post("/", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.userId)
      return res.status(400).json({ error: "userId not provided" });
    if (!payload.muscleGroup)
      return res.status(400).json({ error: "muscleGroup not provided" });
    const session = await createSession(payload);
    return res.status(201).json(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// PATCH /api/sessions/:sessionId/complete
sessionsRouter.patch("/:sessionId/complete", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await completeSession(sessionId);
    return res.status(200).json(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});
