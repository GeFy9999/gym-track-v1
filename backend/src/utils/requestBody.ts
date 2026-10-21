// Request bodies are untrusted JSON: never hand `req.body` straight to Prisma.
// An unexpected key can set columns the route never meant to expose
// (`sessionExerciseId`, `completed`…) or, through a relation field, run a
// nested write on another table (`{ user: { update: { isPro: true } } }`).
// Routes build their Prisma payload from these typed pickers instead.

export const optionalNumber = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

export const optionalString = (
  v: unknown,
  maxLength = 200,
): string | undefined =>
  typeof v === "string" && v.length <= maxLength ? v : undefined;

export const optionalBoolean = (v: unknown): boolean | undefined =>
  typeof v === "boolean" ? v : undefined;

/** Drops keys whose value is undefined, so Prisma leaves those columns alone. */
export const definedOnly = <T extends Record<string, unknown>>(obj: T) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as { [K in keyof T]?: Exclude<T[K], undefined> };
