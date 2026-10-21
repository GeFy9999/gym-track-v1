import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { randomUUID } from "crypto";
import { app } from "../app.js";
import { prisma } from "../prisma.js";

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: vi.fn().mockResolvedValue({}) };
  },
}));

// Signup → confirm the email via the link → go back to the app and log in.
// Signing up never hands out a session, and nothing in its answer reveals
// whether the address already had an account.
// (Own file: the auth rate limiter is per test file.)

const signup = (email: string, password = "testpass123") =>
  request(app)
    .post("/api/auth/register")
    .send({ email, password, name: "Flow" });

const login = (email: string, password = "testpass123") =>
  request(app).post("/api/auth/login").send({ email, password });

const pendingToken = async (email: string) =>
  (await prisma.user.findUnique({ where: { email } }))?.verificationToken ?? null;

describe("signup flow", () => {
  it("only lets the user in once the email link was opened", async () => {
    const email = `flow_${randomUUID()}@example.com`;
    const res = await signup(email);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeUndefined();

    const early = await login(email);
    expect(early.status).toBe(403);
    expect(early.body.emailNotVerified).toBe(true);
    expect(early.body.token).toBeUndefined();

    const verify = await request(app)
      .post("/api/auth/verify-email")
      .send({ token: await pendingToken(email) });
    expect(verify.status).toBe(200);
    expect(verify.body).toEqual({ verified: true });

    const after = await login(email);
    expect(after.status).toBe(200);
    expect(after.body.token).toBeTypeOf("string");
  });

  it("doesn't reveal the unverified state to a wrong password", async () => {
    const email = `flow_${randomUUID()}@example.com`;
    await signup(email);
    const res = await login(email, "not-the-password");
    expect(res.status).toBe(400);
    expect(res.body.emailNotVerified).toBeUndefined();
  });

  it("a signup on a taken email doesn't touch the existing account", async () => {
    const email = `taken_${randomUUID()}@example.com`;
    await signup(email, "original123");
    const token = await pendingToken(email);
    await request(app).post("/api/auth/verify-email").send({ token });

    const again = await signup(email, "attacker123");
    expect(again.status).toBe(201);
    expect(again.body).toEqual({ pending: true });

    expect((await login(email, "original123")).status).toBe(200);
    expect((await login(email, "attacker123")).status).toBe(400);
  });

  it("resends the link by address, answering the same for any address", async () => {
    const email = `resend_${randomUUID()}@example.com`;
    await signup(email);
    const before = await pendingToken(email);

    const known = await request(app)
      .post("/api/auth/resend-verification-email")
      .send({ email });
    const unknown = await request(app)
      .post("/api/auth/resend-verification-email")
      .send({ email: `ghost_${randomUUID()}@example.com` });

    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(known.body).toEqual(unknown.body);
    expect(await pendingToken(email)).not.toBe(before);
  });
});
