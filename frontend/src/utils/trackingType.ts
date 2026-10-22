import { formatDuration } from "./units";

// What a set of an exercise records, which decides the set inputs:
// - WEIGHT_REPS: weight × reps (the default)
// - REPS: bodyweight, reps only — no weight to enter
// - TIME: a duration (treadmill, bike, stairs, running…), no weight or reps
export type TrackingType = "WEIGHT_REPS" | "REPS" | "TIME";

const test = (name: string, pattern: RegExp) => pattern.test(name);

// Custom exercises have no catalog value (Exercise.trackingType), so their
// name is the only hint — English and French words. Built-in exercises are
// classified from the ExerciseDB catalog server-side and never guessed.
export function inferTrackingType(exerciseName: string): TrackingType {
  const name = exerciseName.toLowerCase();

  if (
    test(
      name,
      /treadmill|tapis|bike|v[ée]lo|cycling|elliptic|stair|escalier|stepmill|rowing machine|rameur|ergometer|ergom[eè]tre|skierg|\brun(ning)?\b|course|jogging|\bwalk(ing)?\b|marche|jump rope|corde [àa] sauter/,
    )
  ) {
    return "TIME";
  }

  if (
    !test(name, /weighted|lest[ée]/) &&
    test(
      name,
      /push[- ]?up|pull[- ]?up|chin[- ]?up|\bdips?\b|crunch|sit[- ]?up|burpee|muscle[- ]?up|leg raise|knee raise|air squat|pompe|traction|abdo/,
    )
  ) {
    return "REPS";
  }

  return "WEIGHT_REPS";
}

export function getTrackingType(exercise: {
  name: string;
  trackingType?: string | null;
  isCustom?: boolean;
}): TrackingType {
  if (exercise.trackingType === "REPS" || exercise.trackingType === "TIME") {
    return exercise.trackingType;
  }
  return exercise.isCustom ? inferTrackingType(exercise.name) : "WEIGHT_REPS";
}

/**
 * One set in a few characters, whatever the exercise records: "12:30" for
 * a timed set, "12 reps" for bodyweight, "100 kg × 8" otherwise.
 */
export function formatSetValue(
  set: { weight: number; reps: number; unit: string; durationSeconds?: number | null },
): string {
  if ((set.durationSeconds ?? 0) > 0) return formatDuration(set.durationSeconds!);
  if (set.weight <= 0) return `${set.reps} reps`;
  return `${set.weight} ${set.unit} × ${set.reps}`;
}

/** Whether a set holds anything worth counting (summaries, history…). */
export const hasSetData = (s: {
  weight: number;
  reps: number;
  durationSeconds?: number | null;
}) => s.weight > 0 || s.reps > 0 || (s.durationSeconds ?? 0) > 0;
