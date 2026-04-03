import express from "express";
import { getCalendar } from "../services/calendarService.js";

export const calendarRouter = express.Router();

calendarRouter.get("", async (req, res) => {
  try {
    const calendar = await getCalendar(
      req.query.userId,
      req.query.startDate,
      req.query.endDate,
    );
    return res.status(200).json(calendar);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

calendarRouter.post("postSession", (req, res) => {
  res.json({ status: "ok", message: "Session posted successfully" });
});
