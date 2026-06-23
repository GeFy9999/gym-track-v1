import express from "express";
import { getCalendar } from "../services/calendarService.js";

export const calendarRouter = express.Router();

calendarRouter.get("", async (req, res) => {
  try {
    const calendar = await getCalendar(req.query.userId as string);
    return res.status(200).json(calendar);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
});

calendarRouter.post("postSession", (req, res) => {
  res.json({ status: "ok", message: "Session posted successfully" });
});
