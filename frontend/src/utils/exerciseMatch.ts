export type ExerciseCandidate = {
  id: string;
  name: string;
  muscleGroup: { id: string; name: string };
};

export type MatchSuggestion = { exercise: ExerciseCandidate; confidence: number };

export type MatchResult =
  | { status: "matched"; exercise: ExerciseCandidate; confidence: number }
  | { status: "unmatched"; suggestions: MatchSuggestion[] };

const AUTO_MATCH_THRESHOLD = 0.8;

// Strong (and most competitors) suffix exercise names with the equipment
// used, e.g. "Bench Press (Barbell)" — strip that before comparing since
// our own exercise names don't carry it.
const EQUIPMENT_SUFFIX = /\s*\((barbell|dumbbell|machine|cable|bodyweight|kettlebell|band|assisted|plate|smith|ez[- ]?bar|suspension|weighted)\)\s*$/i;

function normalizeExerciseName(name: string): string {
  return name
    .replace(EQUIPMENT_SUFFIX, "")
    .toLowerCase()
    .replace(/[^a-z0-9À-ÿ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Dice's coefficient (bigram overlap) — a simple, dependency-free string
// similarity measure well suited to short exercise names.
function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigramCounts = (s: string) => {
    const map = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.slice(i, i + 2);
      map.set(bg, (map.get(bg) ?? 0) + 1);
    }
    return map;
  };

  const countsA = bigramCounts(a);
  const countsB = bigramCounts(b);
  let intersection = 0;
  for (const [bg, count] of countsA) {
    const other = countsB.get(bg);
    if (other) intersection += Math.min(count, other);
  }

  const totalBigrams = a.length - 1 + (b.length - 1);
  return (2 * intersection) / totalBigrams;
}

export function matchExerciseName(
  csvName: string,
  candidates: ExerciseCandidate[],
): MatchResult {
  const normalized = normalizeExerciseName(csvName);

  const scored = candidates
    .map((exercise) => ({
      exercise,
      confidence: diceCoefficient(normalized, normalizeExerciseName(exercise.name)),
    }))
    .sort((a, b) => b.confidence - a.confidence);

  const best = scored[0];
  if (best && best.confidence >= AUTO_MATCH_THRESHOLD) {
    return { status: "matched", exercise: best.exercise, confidence: best.confidence };
  }

  return { status: "unmatched", suggestions: scored.slice(0, 5) };
}

// A reasonable default custom-exercise name if the user chooses to create
// one instead of mapping to an existing exercise — CSV name minus the
// equipment suffix.
export function stripEquipmentSuffix(name: string): string {
  return name.replace(EQUIPMENT_SUFFIX, "").trim();
}
