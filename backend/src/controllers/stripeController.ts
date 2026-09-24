import express from "express";
import {
  createCheckoutSession,
  createPortalSession,
  changePlan,
  handleWebhookEvent,
} from "../services/stripeService.js";
import {
  authMiddleware,
  type AuthRequest,
} from "../middleware/authMiddleware.js";

export const stripeRouter = express.Router();

// POST /api/stripe/checkout-session
stripeRouter.post(
  "/checkout-session",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { plan } = req.body;

      if (!plan || !["monthly", "annual", "lifetime"].includes(plan)) {
        return res
          .status(400)
          .json({ error: "Plan invalide (monthly, annual ou lifetime)" });
      }

      const url = await createCheckoutSession(userId, plan);
      return res.status(200).json({ url });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json({ error: message });
    }
  },
);

// POST /api/stripe/change-plan
stripeRouter.post(
  "/change-plan",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { plan } = req.body;

      if (!plan || !["monthly", "annual", "lifetime"].includes(plan)) {
        return res
          .status(400)
          .json({ error: "Plan invalide (monthly, annual ou lifetime)" });
      }

      const result = await changePlan(userId, plan);
      return res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json({ error: message });
    }
  },
);

// POST /api/stripe/portal-session
stripeRouter.post(
  "/portal-session",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const url = await createPortalSession(userId);
      return res.status(200).json({ url });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json({ error: message });
    }
  },
);

// POST /api/stripe/webhook — mounted separately in index.ts with a raw body
// parser, BEFORE express.json(), so the Stripe signature can be verified
// against the untouched request bytes.
export const stripeWebhookHandler = async (
  req: express.Request,
  res: express.Response,
) => {
  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    return res.status(400).json({ error: "Signature Stripe manquante" });
  }

  try {
    await handleWebhookEvent(req.body, signature);
    return res.status(200).json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[stripe webhook error]", message);
    return res.status(400).json({ error: message });
  }
};
