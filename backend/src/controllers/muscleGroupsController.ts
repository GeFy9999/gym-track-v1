import express from "express";
import { getMuscleGroups } from "../services/muscleGroupsService.js";
import { sendServerError } from "../utils/errorResponse.js";

export const muscleGroupsRouter = express.Router();

// Read-only: the muscle groups are a fixed, seeded list shared by every
// user, so there's deliberately no create route any account could call.
muscleGroupsRouter.get("", async (req, res) => {
  try {
    const muscleGroups = await getMuscleGroups();
    return res.status(200).json(muscleGroups);
  } catch (error) {
    return sendServerError(res, error);
  }
});
