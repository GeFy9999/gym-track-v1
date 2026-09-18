export type SetType = "normal" | "warmup" | "dropset" | "failure";

export const SET_TYPE_LETTERS: Record<SetType, string> = {
  normal: "N",
  warmup: "W",
  dropset: "D",
  failure: "F",
};

export const SET_TYPE_COLORS: Record<SetType, string> = {
  normal: "bg-[#c9552c]/10 text-[#c9552c]",
  warmup: "bg-[#c9552c]/10 text-[#c9552c]",
  dropset: "bg-[#c9552c]/10 text-[#c9552c]",
  failure: "bg-[#c9552c]/10 text-[#c9552c]",
};

export const SET_TYPE_ACCENTS: Record<SetType, string> = {
  normal: "#c9552c",
  warmup: "#c9552c",
  dropset: "#c9552c",
  failure: "#c9552c",
};

export const SET_TYPE_OPTIONS: { value: SetType; label: string }[] = [
  { value: "normal", label: "Normal Set" },
  { value: "warmup", label: "Warm-up Set" },
  { value: "dropset", label: "Drop Set" },
  { value: "failure", label: "Failure Set" },
];

export function getSetTypeColor(type: string): string {
  return SET_TYPE_COLORS[type as SetType] ?? SET_TYPE_COLORS.normal;
}

export function getSetTypeAccent(type: string): string {
  return SET_TYPE_ACCENTS[type as SetType] ?? SET_TYPE_ACCENTS.normal;
}

export function getSetBadgeLabel(type: string, index: number): string {
  if (type === "normal" || !type) return String(index + 1);
  const letter = SET_TYPE_LETTERS[type as SetType] ?? "N";
  return `${letter}${index + 1}`;
}
