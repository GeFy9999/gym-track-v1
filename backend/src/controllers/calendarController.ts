import express from "express";
import { getCalendar } from "../services/calendarService.js";
import {
  authMiddleware,
  type AuthRequest,
} from "../middleware/authMiddleware.js";
import { sendServerError } from "../utils/errorResponse.js";

export const calendarRouter = express.Router();

calendarRouter.get("", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const calendar = await getCalendar(req.userId!);
    return res.status(200).json(calendar);
  } catch (error) {
    return sendServerError(res, error);
  }
});

calendarRouter.post("postSession", (req, res) => {
  res.json({ status: "ok", message: "Session posted successfully" });
});
