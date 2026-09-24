import type { Response } from "express";

// Unexpected errors (DB failures, bugs) can carry internal details — table
// names, file paths, Prisma query text. Log the real error server-side but
// never forward it to the client; only deliberate 4xx business errors
// (thrown with a safe, user-facing message) should reach the response body.
export function sendServerError(res: Response, error: unknown) {
  console.error(error);
  return res.status(500).json({ error: "Une erreur interne est survenue" });
}
