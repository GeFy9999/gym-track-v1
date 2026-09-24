import express from "express";
import { prisma } from "../prisma.js";
import {
  authMiddleware,
  type AuthRequest,
} from "../middleware/authMiddleware.js";
import { sendServerError } from "../utils/errorResponse.js";

export const progressPhotoRouter = express.Router();

// GET /api/progress-photos
progressPhotoRouter.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const photos = await prisma.progressPhoto.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, data: true, note: true, createdAt: true },
    });
    return res.status(200).json(photos);
  } catch (error) {
    return sendServerError(res, error);
  }
});

// GET /api/progress-photos/:id/image
progressPhotoRouter.get(
  "/:id/image",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const id = req.params.id as string;
      const photo = await prisma.progressPhoto.findFirst({
        where: { id, userId },
        select: { data: true },
      });
      if (!photo) return res.status(404).json({ error: "Photo non trouvée" });
      return res.status(200).json({ data: photo.data });
    } catch (error) {
      return sendServerError(res, error);
    }
  },
);

// POST /api/progress-photos
progressPhotoRouter.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { data, note } = req.body;

    if (!data || typeof data !== "string") {
      return res.status(400).json({ error: "Image requise (base64)" });
    }

    const photo = await prisma.progressPhoto.create({
      data: { userId, data, note: note || null },
      select: { id: true, note: true, createdAt: true },
    });
    return res.status(201).json(photo);
  } catch (error) {
    return sendServerError(res, error);
  }
});

// DELETE /api/progress-photos/:id
progressPhotoRouter.delete(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const id = req.params.id as string;
      const photo = await prisma.progressPhoto.findFirst({
        where: { id, userId },
      });
      if (!photo) return res.status(404).json({ error: "Photo non trouvée" });

      await prisma.progressPhoto.delete({ where: { id } });
      return res.status(200).json({ success: true });
    } catch (error) {
      return sendServerError(res, error);
    }
  },
);
