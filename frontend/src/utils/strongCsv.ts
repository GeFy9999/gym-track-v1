import Papa from "papaparse";

export type ParsedExercise = {
  name: string;
  sets: { weight: number; reps: number }[];
};

export type ParsedWorkout = {
  key: string;
  date: string; // ISO
  workoutName: string;
  exercises: ParsedExercise[];
};

// Strong exports "YYYY-MM-DD HH:mm:ss", which isn't reliably parsed by
// `new Date()` across browsers — normalize to ISO 8601 first.
function parseStrongDate(raw: string): string | null {
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function parseStrongCsv(csvText: string): ParsedWorkout[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const workoutsByKey = new Map<string, ParsedWorkout>();

  for (const row of result.data) {
    const dateStr = row["Date"]?.trim();
    const workoutName = row["Workout Name"]?.trim() || "Séance importée";
    const exerciseName = row["Exercise Name"]?.trim();
    if (!dateStr || !exerciseName) continue;

    const isoDate = parseStrongDate(dateStr);
    if (!isoDate) continue;

    const weight = Number(row["Weight"]);
    const reps = Number(row["Reps"]);
    if (!Number.isFinite(weight) || !Number.isFinite(reps)) continue;
    if (weight <= 0 && reps <= 0) continue;

    const key = `${dateStr}__${workoutName}`;
    let workout = workoutsByKey.get(key);
    if (!workout) {
      workout = { key, date: isoDate, workoutName, exercises: [] };
      workoutsByKey.set(key, workout);
    }

    let exercise = workout.exercises.find((e) => e.name === exerciseName);
    if (!exercise) {
      exercise = { name: exerciseName, sets: [] };
      workout.exercises.push(exercise);
    }

    exercise.sets.push({ weight: Math.max(0, weight), reps: Math.max(0, reps) });
  }

  return Array.from(workoutsByKey.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

export function getUniqueExerciseNames(workouts: ParsedWorkout[]): string[] {
  const names = new Set<string>();
  for (const w of workouts) {
    for (const e of w.exercises) names.add(e.name);
  }
  return Array.from(names).sort();
}

export function getDateRange(workouts: ParsedWorkout[]): [Date, Date] | null {
  if (workouts.length === 0) return null;
  return [new Date(workouts[0].date), new Date(workouts[workouts.length - 1].date)];
}
