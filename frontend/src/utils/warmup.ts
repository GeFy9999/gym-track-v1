export type WarmupSetPlan = { weight: number; reps: number };

export const MIN_WARMUP_SETS = 1;
export const MAX_WARMUP_SETS = 6;
export const DEFAULT_WARMUP_SETS = 3;

// Ramps from light/high-rep to heavy/low-rep, ending just below the working
// weight. With a single set requested, use a moderate midpoint rather than
// the top of the range.
const START_PERCENTAGE = 0.4;
const END_PERCENTAGE = 0.85;
const START_REPS = 10;
const END_REPS = 3;

export function computeWarmupSets(
  workingWeight: number,
  unit: string,
  count: number,
): WarmupSetPlan[] {
  const roundTo = unit === "kg" ? 2.5 : 5;
  const clampedCount = Math.min(
    Math.max(count, MIN_WARMUP_SETS),
    MAX_WARMUP_SETS,
  );

  return Array.from({ length: clampedCount }, (_, i) => {
    const t = clampedCount === 1 ? 0.5 : i / (clampedCount - 1);
    const percentage = START_PERCENTAGE + (END_PERCENTAGE - START_PERCENTAGE) * t;
    const reps = Math.round(START_REPS + (END_REPS - START_REPS) * t);
    const weight = Math.max(
      roundTo,
      Math.round((workingWeight * percentage) / roundTo) * roundTo,
    );
    return { weight, reps };
  });
}
