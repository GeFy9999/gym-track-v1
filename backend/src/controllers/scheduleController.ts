import express from "express";
import {
  getSchedule,
  createSchedule,
  editSchedule,
} from "../services/scheduleService.js";
import {
  authMiddleware,
  type AuthRequest,
} from "../middleware/authMiddleware.js";

export const scheduleRouter = express.Router();

// GET /api/schedule/me
scheduleRouter.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const schedule = await getSchedule(req.userId!);
    if (!schedule) return res.status(404).json({ error: "Schedule not found" });
    return res.status(200).json(schedule);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// POST /api/schedule
scheduleRouter.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const payload = req.body;
    if (!payload.frequency)
      return res.status(400).json({ error: "frequency not provided" });
    if (!payload.days)
      return res.status(400).json({ error: "days not provided" });
    const schedule = await createSchedule({ ...payload, userId: req.userId! });
    return res.status(201).json(schedule);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

// PUT /api/schedule/me
scheduleRouter.put("/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const payload = req.body;
    const schedule = await editSchedule(req.userId!, payload);
    return res.status(200).json(schedule);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});
