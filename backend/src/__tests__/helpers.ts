import request from "supertest";
import { randomUUID } from "crypto";
import { app } from "../app.js";
import { prisma } from "../prisma.js";
import { login } from "../services/authService.js";

// Signs up, confirms the email (as clicking the link would) and logs in —
// signup itself no longer returns a session.
export async function registerUser(
  overrides: Partial<{ email: string; password: string; name: string }> = {},
) {
  const email = overrides.email ?? `test_${randomUUID()}@example.com`;
  const password = overrides.password ?? "testpass123";
  const name = overrides.name ?? "Test User";

  const res = await request(app)
    .post("/api/auth/register")
    .send({ email, password, name });

  await prisma.user.update({
    where: { email },
    data: {
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    },
  });

  // The service directly, not POST /login: that route's rate limiter would
  // otherwise count every test user twice (signup + login).
  const session = await login({ email, password });

  return {
    res,
    email,
    password,
    token: session.token,
    user: session.user,
  };
}
