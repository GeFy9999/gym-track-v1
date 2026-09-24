import rateLimit from "express-rate-limit";

// Login/register: generous enough for a mistyped password a few times,
// tight enough to make credential stuffing / account brute-forcing slow.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives, réessaie dans quelques minutes." },
});

// Forgot/reset password: stricter, since this also gates email sending.
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives, réessaie dans quelques minutes." },
});
