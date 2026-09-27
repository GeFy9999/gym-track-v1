import express from "express";
import {
  createMuscleGroup,
  getMuscleGroups,
} from "../services/muscleGroupsService.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { sendServerError } from "../utils/errorResponse.js";

export const muscleGroupsRouter = express.Router();

muscleGroupsRouter.get("", async (req, res) => {
  try {
    const muscleGroups = await getMuscleGroups();
    return res.status(200).json(muscleGroups);
  } catch (error) {
    return sendServerError(res, error);
  }
});

muscleGroupsRouter.post("", authMiddleware, async (req, res) => {
  try {
    const payload = req.body;
    if (!payload) {
      return res.status(400).json({ error: "Payload requis" });
    }
    if (!payload.name) {
      return res.status(400).json({ error: "Nom requis" });
    }
    if (!payload.description) {
      return res.status(400).json({ error: "Description requise" });
    }
    if (!payload.image) {
      return res.status(400).json({ error: "Image requise" });
    }
    await createMuscleGroup(payload);
    return res.status(201).json();
  } catch (error) {
    return sendServerError(res, error);
  }
});
