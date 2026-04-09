import express from "express";
import {
  getSession,
  createSession,
  completeSession,
} from "../services/sessionsService.js";

export const sessionsRouter = express.Router();

// GET /api/sessions/:sessionId
sessionsRouter.get("/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await getSession(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    return res.status(200).json(session);
  } catch (error) {
    return res.status(500).json({ error: error.message });
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
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /api/sessions/:sessionId/complete
sessionsRouter.patch("/:sessionId/complete", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await completeSession(sessionId);
    return res.status(200).json(session);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
