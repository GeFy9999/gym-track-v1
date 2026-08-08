export function getWeightUnit(): string {
  const stored = localStorage.getItem("user");
  if (!stored) return "lb";
  const user = JSON.parse(stored);
  return user.weightUnit || "lb";
}
