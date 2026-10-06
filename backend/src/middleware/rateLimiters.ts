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

// Exercise GIFs and thumbnails come from the licensed ExerciseDB pack, whose
// EULA forbids endpoints that allow bulk download of its media. Generous
// enough for scrolling the whole exercise list (thumbnails are also cached
// by the browser for a week), but far too slow to scrape the collection.
export const exerciseMediaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes, réessaie dans quelques minutes." },
});

// Public contact form (marketing site): a person rarely writes more than a
// couple of times an hour; this stops a script from flooding the support
// inbox through it.
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de messages envoyés, réessaie plus tard." },
});
