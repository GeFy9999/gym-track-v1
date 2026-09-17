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

export type PlateBreakdown = {
  plates: number[];
  remainder: number;
};

const EPSILON = 0.001;

export function calculatePlates(
  perSideWeight: number,
  unit: string,
): PlateBreakdown {
  const available = PLATE_WEIGHTS[unit] || PLATE_WEIGHTS.lb;
  let remaining = Math.max(0, perSideWeight);
  const plates: number[] = [];

  for (const plate of available) {
    while (remaining + EPSILON >= plate) {
      plates.push(plate);
      remaining = Math.round((remaining - plate) * 100) / 100;
    }
  }

  return { plates, remainder: remaining };
}
