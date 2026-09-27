import request from "supertest";
import { randomUUID } from "crypto";
import { app } from "../app.js";

export async function registerUser(
  overrides: Partial<{ email: string; password: string; name: string }> = {},
) {
  const email = overrides.email ?? `test_${randomUUID()}@example.com`;
  const password = overrides.password ?? "testpass123";
  const name = overrides.name ?? "Test User";

  const res = await request(app)
    .post("/api/auth/register")
    .send({ email, password, name });

  return {
    res,
    email,
    password,
    token: res.body.token as string,
    user: res.body.user,
  };
}
