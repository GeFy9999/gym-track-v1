export type SetData = {
  id: string;
  weight: number;
  reps: number;
  unit: string;
  completed: boolean;
  type: string;
  // Timed exercises only (see utils/trackingType).
  durationSeconds?: number | null;
};

export type SessionExercise = {
  id: string;
  exercise: {
    id: string;
    name: string;
    image: string | null;
    // Curated loading type (see utils/loadingType); null when not set.
    loadingType?: string | null;
    // What a set records (see utils/trackingType); null = weight × reps.
    trackingType?: string | null;
    isCustom?: boolean;
  };
  sets: SetData[];
  supersetId: string | null;
};

export type SessionData = {
  id: string;
  muscleGroup: string;
  completed: boolean;
  date: string;
  sessionExercises: SessionExercise[];
};

export type AvailableExercise = {
  id: string;
  name: string;
  image: string | null;
  loadingType?: string | null;
  trackingType?: string | null;
  isCustom?: boolean;
  muscleGroup: { id: string; name: string };
};

export type LastWeight = {
  exerciseId: string;
  weight: number;
};

export type TrackedExercise = {
  id: string;
  exerciseId: string;
};

export type ExerciseNote = {
  id: string;
  exerciseId: string;
  note: string;
};
