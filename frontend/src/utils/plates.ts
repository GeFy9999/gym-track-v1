const BARBELL_EXERCISE_PATTERNS = [
  "barbell",
  "bench press",
  "squat",
  "deadlift",
  "overhead press",
  "ohp",
  "military press",
  "clean",
  "snatch",
  "row",
];

export function isLikelyBarbellExercise(name: string): boolean {
  const lower = name.toLowerCase();
  return BARBELL_EXERCISE_PATTERNS.some((p) => lower.includes(p));
}

export const BAR_WEIGHTS: Record<string, number[]> = {
  lb: [45, 35, 15],
  kg: [20, 15, 10],
};

export const PLATE_WEIGHTS: Record<string, number[]> = {
  lb: [45, 35, 25, 10, 5, 2.5],
  kg: [25, 20, 15, 10, 5, 2.5, 1.25],
};

export function getDefaultBarWeight(unit: string): number {
  return (BAR_WEIGHTS[unit] || BAR_WEIGHTS.lb)[0];
}

export const MIN_WEIGHT = 1;
export const MAX_WEIGHT = 1000;
export const MIN_REPS = 1;
export const MAX_REPS = 100;

export type PlateBreakdown = {
  plates: number[];
  remainder: number;
};

const EPSILON = 0.001;
// Hard cap on how many plates we'll ever compute, independent of the input
// weight. Protects against a runaway loop (and a giant DOM) if an
// unreasonably large weight ever reaches this function.
const MAX_PLATES = 60;

export function calculatePlates(
  perSideWeight: number,
  unit: string,
): PlateBreakdown {
  const available = PLATE_WEIGHTS[unit] || PLATE_WEIGHTS.lb;
  let remaining = Math.max(0, Math.min(perSideWeight, MAX_WEIGHT));
  const plates: number[] = [];

  for (const plate of available) {
    while (remaining + EPSILON >= plate && plates.length < MAX_PLATES) {
      plates.push(plate);
      remaining = Math.round((remaining - plate) * 100) / 100;
    }
    if (plates.length >= MAX_PLATES) break;
  }

  return { plates, remainder: remaining };
}
