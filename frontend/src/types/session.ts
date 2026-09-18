export type SetData = {
  id: string;
  weight: number;
  reps: number;
  unit: string;
  completed: boolean;
  type: string;
};

export type SessionExercise = {
  id: string;
  exercise: { id: string; name: string; image: string | null };
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
