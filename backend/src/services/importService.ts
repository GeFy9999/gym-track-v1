import {
  insertImportBatch,
  deleteImportBatch,
} from "../repositories/databaseRepository.js";

export type ImportWorkout = {
  date: string;
  muscleGroup: string;
  exercises: {
    exerciseId: string;
    sets: { weight: number; reps: number; unit: string }[];
  }[];
};

const MAX_WORKOUTS_PER_IMPORT = 2000;

export async function importWorkouts(userId: string, workouts: ImportWorkout[]) {
  if (!Array.isArray(workouts) || workouts.length === 0) {
    throw new Error("Aucune séance à importer");
  }
  if (workouts.length > MAX_WORKOUTS_PER_IMPORT) {
    throw new Error(`Trop de séances dans un seul import (max ${MAX_WORKOUTS_PER_IMPORT})`);
  }

  for (const workout of workouts) {
    if (!workout.date || Number.isNaN(new Date(workout.date).getTime())) {
      throw new Error("Date de séance invalide dans l'import");
    }
    if (!workout.muscleGroup) {
      throw new Error("Groupe musculaire manquant dans l'import");
    }
    if (!Array.isArray(workout.exercises) || workout.exercises.length === 0) {
      throw new Error("Séance sans exercice dans l'import");
    }
    for (const exercise of workout.exercises) {
      if (!exercise.exerciseId) {
        throw new Error("Exercice non résolu dans l'import");
      }
    }
  }

  const importBatchId = crypto.randomUUID();
  const sessions = await insertImportBatch(userId, importBatchId, workouts);

  return {
    importBatchId,
    sessionsCreated: sessions.length,
    setsCreated: workouts.reduce(
      (total, w) =>
        total + w.exercises.reduce((t, e) => t + e.sets.length, 0),
      0,
    ),
  };
}

export async function undoImportBatch(userId: string, importBatchId: string) {
  return await deleteImportBatch(userId, importBatchId);
}
