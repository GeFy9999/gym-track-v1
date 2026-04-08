import express from "express";
import {
  createMuscleGroup,
  getMuscleGroups,
} from "../services/muscleGroupsService.js";

export const muscleGroupsRouter = express.Router();

muscleGroupsRouter.get("", async (req, res) => {
  try {
    const muscleGroups = await getMuscleGroups();
    return res.status(200).json(muscleGroups);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

muscleGroupsRouter.post("", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload) {
      return res.status(400).json("payload not provided");
    }
    if (!payload.name) {
      return res.status(400).json("name not provided");
    }
    if (!payload.description) {
      return res.status(400).json("description not provided");
    }
    if (!payload.image) {
      return res.status(400).json("image not provided");
    }
    await createMuscleGroup(payload);
    return res.status(201);
  } catch (error) {
    console.error(error.message, error);
    return res.status(500).json({ error: error.message });
  }
});
