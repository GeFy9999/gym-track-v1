import { describe, it, expect } from "vitest";
import request from "supertest";
import { randomUUID } from "crypto";
import { app } from "../app.js";

// Own file so the authLimiter's in-memory counter (module-level state) isn't
// shared with auth.test.ts and doesn't make those tests flaky depending on
// run order — vitest gives each test file its own module registry.

describe("rate limiting", () => {
  it("blocks login attempts past the configured limit", async () => {
    const email = `ratelimit_${randomUUID()}@example.com`;

    let lastStatus = 0;
    for (let i = 0; i < 11; i++) {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email, password: "whatever" });
      lastStatus = res.status;
    }

    // The first 10 attempts fail auth normally (400); the 11th within the
    // window must be rejected by express-rate-limit before it even reaches
    // the login handler.
    expect(lastStatus).toBe(429);
  });
});
