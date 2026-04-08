import express from "express";

export const metaRouter = express.Router();

metaRouter.get("health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});
