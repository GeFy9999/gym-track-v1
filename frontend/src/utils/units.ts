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
