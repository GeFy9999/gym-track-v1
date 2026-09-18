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
