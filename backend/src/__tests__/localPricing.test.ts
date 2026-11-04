import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { resetRatesCacheForTests } from "../services/localPriceService.js";

// A UK and a Canadian address from the GeoLite2 data. The app trusts one
// proxy hop, so X-Forwarded-For stands in for the visitor's address.
const UK_IP = "81.2.69.142";
const CANADA_IP = "24.48.0.1";

describe("GET /api/pricing/local", () => {
  beforeEach(() => {
    resetRatesCacheForTests();
    // A developer's local .env may set it; each test opts in explicitly.
    vi.stubEnv("DEV_FAKE_IP", "");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ base: "CAD", rates: { GBP: 0.53, EUR: 0.64 } })),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("gives a foreign visitor their currency and the CAD rate", async () => {
    const res = await request(app)
      .get("/api/pricing/local")
      .set("X-Forwarded-For", UK_IP);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ currency: "GBP", rate: 0.53 });
  });

  it("keeps a Canadian visitor in CAD without fetching rates", async () => {
    const res = await request(app)
      .get("/api/pricing/local")
      .set("X-Forwarded-For", CANADA_IP);
    expect(res.body).toEqual({ currency: "CAD", rate: 1 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("falls back to CAD for an address it can't place", async () => {
    const res = await request(app).get("/api/pricing/local");
    expect(res.body).toEqual({ currency: "CAD", rate: 1 });
  });

  it("uses DEV_FAKE_IP for a local request, not for a real visitor", async () => {
    vi.stubEnv("DEV_FAKE_IP", "90.84.0.1"); // France
    const local = await request(app).get("/api/pricing/local");
    expect(local.body).toEqual({ currency: "EUR", rate: 0.64 });
    const visitor = await request(app)
      .get("/api/pricing/local")
      .set("X-Forwarded-For", CANADA_IP);
    expect(visitor.body).toEqual({ currency: "CAD", rate: 1 });
  });

  it("returns no rate when the rates service is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 503 })));
    const res = await request(app)
      .get("/api/pricing/local")
      .set("X-Forwarded-For", UK_IP);
    expect(res.body).toEqual({ currency: "GBP", rate: null });
  });
});
