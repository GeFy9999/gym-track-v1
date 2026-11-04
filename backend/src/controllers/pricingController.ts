import express from "express";
import { getLocalPriceInfo } from "../services/localPriceService.js";
import { sendServerError } from "../utils/errorResponse.js";

export const pricingRouter = express.Router();

// Running locally, every request comes from 127.0.0.1 (a VPN doesn't change
// that), which no country matches. DEV_FAKE_IP, set only in a local .env,
// stands in for such a request's address to test another country.
function visitorIp(ip: string | undefined) {
  const fake = process.env.DEV_FAKE_IP;
  const isLocal = !ip || /^(::1|127\.|::ffff:127\.)/.test(ip);
  return fake && isLocal ? fake : ip;
}

// GET /api/pricing/local — the visitor's currency (from their IP address,
// looked up locally: the IP is never sent anywhere) and the CAD rate for it.
pricingRouter.get("/local", async (req, res) => {
  try {
    res.json(await getLocalPriceInfo(visitorIp(req.ip)));
  } catch (err) {
    sendServerError(res, err);
  }
});
