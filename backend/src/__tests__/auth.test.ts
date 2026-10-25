import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { randomUUID } from "crypto";
import { app } from "../app.js";
import { registerUser } from "./helpers.js";

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: vi.fn().mockResolvedValue({}) };
  },
}));

describe("auth", () => {
  it("registers a new user without logging them in", async () => {
    const { res, user } = await registerUser();
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ pending: true });
    expect(user.isPro).toBe(false);
  });

  it("answers a duplicate signup exactly like a new one", async () => {
    const email = `dup_${randomUUID()}@example.com`;
    const first = await registerUser({ email });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, password: "otherpass123", name: "Dup" });
    expect(res.status).toBe(first.res.status);
    expect(res.body).toEqual(first.res.body);
  });

  it("logs in with correct credentials", async () => {
    const { email, password } = await registerUser();
    const res = await request(app).post("/api/auth/login").send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf("string");
    // Password hash must never leak into the API response.
    expect(res.body.user.password).toBeUndefined();
  });

  it("returns the same generic error for a wrong password and an unknown email", async () => {
    // A different error message per case would let an attacker enumerate
    // which emails have an account — see authService.login.
    const { email, password } = await registerUser();
    const wrongPassRes = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "wrongpassword" });
    const unknownEmailRes = await request(app)
      .post("/api/auth/login")
      .send({ email: `nope_${randomUUID()}@example.com`, password });

    expect(wrongPassRes.status).toBe(400);
    expect(unknownEmailRes.status).toBe(400);
    expect(wrongPassRes.body.error).toBe(unknownEmailRes.body.error);
  });

  it("forgot-password responds identically for a known and an unknown email", async () => {
    const { email } = await registerUser();
    const knownRes = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email });
    const unknownRes = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: `ghost_${randomUUID()}@example.com` });

    expect(knownRes.status).toBe(200);
    expect(unknownRes.status).toBe(200);
    expect(knownRes.body).toEqual(unknownRes.body);
  });

  it("rejects a protected route with no token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects a protected route with a garbage token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });

  it("returns the authenticated user on GET /me", async () => {
    const { token, user } = await registerUser();
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
  });
});
