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
import { sendServerError } from "../utils/errorResponse.js";
import {
  definedOnly,
  optionalNumber,
  optionalString,
} from "../utils/requestBody.js";

export const scheduleRouter = express.Router();

// GET /api/schedule/me
scheduleRouter.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const schedule = await getSchedule(req.userId!);
    if (!schedule) return res.status(404).json({ error: "Horaire introuvable" });
    return res.status(200).json(schedule);
  } catch (error) {
    return sendServerError(res, error);
  }
});

// POST /api/schedule
scheduleRouter.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const frequency = optionalNumber(req.body?.frequency);
    const days = optionalString(req.body?.days);
    if (!frequency)
      return res.status(400).json({ error: "Fréquence requise" });
    if (!days)
      return res.status(400).json({ error: "Jours requis" });
    const schedule = await createSchedule({
      frequency,
      days,
      userId: req.userId!,
    });
    return res.status(201).json(schedule);
  } catch (error) {
    return sendServerError(res, error);
  }
});

// PUT /api/schedule/me
scheduleRouter.put("/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const schedule = await editSchedule(
      req.userId!,
      definedOnly({
        frequency: optionalNumber(req.body?.frequency),
        days: optionalString(req.body?.days),
      }),
    );
    return res.status(200).json(schedule);
  } catch (error) {
    return sendServerError(res, error);
  }
});
