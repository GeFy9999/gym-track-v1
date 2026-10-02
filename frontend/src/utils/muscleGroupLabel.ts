import type { TFunction } from "i18next";

// MuscleGroup.name in the DB (and Session.muscleGroup, which copies that
// name as a plain string at session-creation time — there's no foreign key,
// so historical sessions keep whatever text existed when they were made)
// was never meant to be user-facing display text, just a stable-ish
// identifier. It's stored as French/English and with inconsistent accents,
// so it can't be rendered directly if the UI should follow the user's
// chosen language. This maps every variant seen in the data to a slug with
// a real translation in muscleGroups.* (fr.json / en.json), and falls back
// to the raw stored value for anything unmapped (e.g. a future group) so a
// name never silently disappears from the UI.
const MUSCLE_GROUP_SLUGS: Record<string, string> = {
  Chest: "chest",
  Pectoraux: "chest",
  Dos: "back",
  Biceps: "biceps",
  Triceps: "triceps",
  Épaules: "shoulders",
  Epaules: "shoulders",
  "Avant-bras": "forearms",
  Trapèze: "traps",
  Trapeze: "traps",
  Legs: "legs",
  Abdominaux: "abs",
};

export function getMuscleGroupLabel(name: string, t: TFunction): string {
  const slug = MUSCLE_GROUP_SLUGS[name];
  if (!slug) return name;
  return t(`muscleGroups.${slug}`);
}
