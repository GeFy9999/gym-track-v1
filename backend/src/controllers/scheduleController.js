import express from "express";
import {
  getSchedule,
  createSchedule,
  editSchedule,
} from "../services/scheduleService.js";

export const scheduleRouter = express.Router();

// GET /api/schedule/:userId
scheduleRouter.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const schedule = await getSchedule(userId);
    if (!schedule) return res.status(404).json({ error: "Schedule not found" });
    return res.status(200).json(schedule);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/schedule
scheduleRouter.post("/", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.userId)
      return res.status(400).json({ error: "userId not provided" });
    if (!payload.frequency)
      return res.status(400).json({ error: "frequency not provided" });
    if (!payload.days)
      return res.status(400).json({ error: "days not provided" });
    const schedule = await createSchedule(payload);
    return res.status(201).json(schedule);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PUT /api/schedule/:userId
// Pour plus tard (si user veut changer sa schedule)
scheduleRouter.put("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const payload = req.body;
    const schedule = await editSchedule(userId, payload);
    return res.status(200).json(schedule);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
