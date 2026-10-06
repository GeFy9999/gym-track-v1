import { getDateLocale } from "../i18n";
export function getWeightUnit(): string {
  const stored = localStorage.getItem("user");
  if (!stored) return "lb";
  const user = JSON.parse(stored);
  return user.weightUnit || "lb";
}

export function getRestTimerSeconds(): number {
  const stored = localStorage.getItem("user");
  if (!stored) return 120;
  const user = JSON.parse(stored);
  return user.restTimerSeconds || 120;
}

export function getRestTimerEnabled(): boolean {
  const stored = localStorage.getItem("user");
  if (!stored) return false;
  const user = JSON.parse(stored);
  return user.restTimerEnabled ?? false;
}

export function getBarbellModeEnabled(): boolean {
  const stored = localStorage.getItem("user");
  if (!stored) return false;
  const user = JSON.parse(stored);
  return user.barbellModeEnabled ?? false;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

// A whole workout's length ("45 min" / "1h 15"), as opposed to formatDuration
// above (a rest timer's "M:SS" countdown) — kept distinct since the two read
// very differently despite both being "duration" formatters.
export function formatWorkoutDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h ${String(rest).padStart(2, "0")}` : `${hours}h`;
}

const LB_PER_KG = 2.2046226218;

export function convertWeight(value: number, from: string, to: string): number {
  if (from === to) return value;
  if (from === "kg" && to === "lb") return value * LB_PER_KG;
  if (from === "lb" && to === "kg") return value / LB_PER_KG;
  return value;
}

export function roundWeight(value: number): number {
  return Math.round(value * 10) / 10;
}

// A money amount with 2 decimals in the app's language: "1,00" in French,
// "1.00" in English (the currency sign is added by the caller).
export function formatAmount(value: number): string {
  return new Intl.NumberFormat(getDateLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
