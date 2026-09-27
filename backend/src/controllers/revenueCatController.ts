import express from "express";
import { handleRevenueCatWebhook } from "../services/revenueCatService.js";

export const revenueCatRouter = express.Router();

// POST /api/revenuecat/webhook — no authMiddleware, RevenueCat authenticates
// via the Authorization header value configured in its dashboard instead.
revenueCatRouter.post("/webhook", async (req, res) => {
  try {
    await handleRevenueCatWebhook(req.headers.authorization, req.body);
    return res.status(200).json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[revenuecat webhook error]", message);
    return res.status(400).json({ error: message });
  }
});
