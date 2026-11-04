import express from "express";
import { getLocalPriceInfo } from "../services/localPriceService.js";
import { sendServerError } from "../utils/errorResponse.js";

export const pricingRouter = express.Router();

// GET /api/pricing/local — the visitor's currency (from their IP address,
// looked up locally: the IP is never sent anywhere) and the CAD rate for it.
pricingRouter.get("/local", async (req, res) => {
  try {
    res.json(await getLocalPriceInfo(req.ip));
  } catch (err) {
    sendServerError(res, err);
  }
});
