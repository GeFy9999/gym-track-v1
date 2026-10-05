// How an exercise's weight is loaded, which decides what the set inputs ask
// for: a barbell's total + bar, a plate-loaded machine's weight per side, a
// single dumbbell, a stack, added weight, or assistance.
export const LOADING_TYPES = [
  "BARBELL",
  "PLATE_LOADED",
  "DUMBBELL",
  "MACHINE",
  "CABLE",
  "BODYWEIGHT",
  "ASSISTED",
] as const;

export type LoadingType = (typeof LOADING_TYPES)[number];

export function isLoadingType(value: unknown): value is LoadingType {
  return LOADING_TYPES.includes(value as LoadingType);
}

const test = (name: string, ...patterns: RegExp[]) =>
  patterns.some((p) => p.test(name));

// Best guess from the exercise name alone (English catalog names plus
// common French words for custom exercises). Order matters: explicit
// equipment words win over movement names, so "Dumbbell Bench Press" is a
// dumbbell exercise even though "bench press" alone would mean a barbell.
// Users can always correct a wrong guess per exercise.
export function inferLoadingType(exerciseName: string): LoadingType {
  const name = exerciseName.toLowerCase();

  if (
    test(name, /assist/) &&
    test(name, /pull[- ]?up|chin[- ]?up|dip|traction/)
  ) {
    return "ASSISTED";
  }

  if (test(name, /dumbbell|\bdb\b|halt[eè]re|kettlebell/)) return "DUMBBELL";
  if (test(name, /cable|pulley|poulie|c[aâ]ble|rope|crossover|pushdown/)) {
    return "CABLE";
  }

  // Plate-loaded machines: weight is stacked on two horns, so it's entered
  // per side. Smith machines load the same way (and their bar weight varies
  // too much between gyms to assume one).
  if (
    test(
      name,
      /smith|sled|leg press|presse|hack squat|t[- ]?bar|landmine|hammer strength|iso[- ]?lateral|plate[- ]?loaded/,
    ) ||
    (test(name, /\blever\b/) &&
      test(name, /press|row|shrug|deadlift|squat|pulldown/))
  ) {
    return "PLATE_LOADED";
  }

  if (test(name, /\blever\b|machine|selectori[sz]ed|pec deck/)) {
    return "MACHINE";
  }

  if (test(name, /barbell|ez[- ]?bar|olympic|trap bar|\bbarre\b/)) {
    return "BARBELL";
  }

  if (
    test(
      name,
      /push[- ]?up|pull[- ]?up|chin[- ]?up|\bdips?\b|plank|crunch|sit[- ]?up|burpee|muscle[- ]?up|leg raise|knee raise|inverted row|hyperextension|air squat|jump|pompe|traction|gainage|weighted/,
    )
  ) {
    return "BODYWEIGHT";
  }

  if (
    test(
      name,
      /bench press|squat|deadlift|overhead press|military press|\bohp\b|clean|snatch|good morning|hip thrust|bent[- ]over row|d[ée]velopp[ée]|soulev[ée] de terre/,
    )
  ) {
    return "BARBELL";
  }

  return "MACHINE";
}

// Barbells and plate-loaded machines are entered per side (that's how
// they're loaded); the stored set weight is always the TOTAL load — the
// other side plus, for a barbell, the bar itself.
export function isPerSideInput(loadingType: LoadingType | null): boolean {
  return loadingType === "BARBELL" || loadingType === "PLATE_LOADED";
}

// Two decimals: kg plates go down to 1.25 per side, which one decimal
// would turn into 1.3 (and corrupt the total if the field is re-saved).
const round2 = (n: number) => Math.round(n * 100) / 100;

// Total stored weight → what the per-side input shows.
export function toDisplayedWeight(
  total: number,
  loadingType: LoadingType | null,
  barWeight: number,
): number {
  if (!isPerSideInput(loadingType)) return total;
  const base = loadingType === "BARBELL" ? barWeight : 0;
  return Math.max(0, round2((total - base) / 2));
}

// What was typed (per side or not) → total stored weight. An empty input
// stays 0, not "just the bar".
export function toTotalWeight(
  displayed: number,
  loadingType: LoadingType | null,
  barWeight: number,
): number {
  if (!isPerSideInput(loadingType) || displayed <= 0) return displayed;
  const base = loadingType === "BARBELL" ? barWeight : 0;
  return base + displayed * 2;
}
