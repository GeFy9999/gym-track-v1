export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

export function getThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // Storage blocked: fall through to the default.
  }
  // Light until the user picks otherwise in Profile — an update shouldn't
  // switch anyone's theme by itself.
  return "light";
}

const systemPrefersDark = () =>
  window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;

function apply(preference: ThemePreference) {
  const dark =
    preference === "dark" || (preference === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
}

export function setThemePreference(preference: ThemePreference) {
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Still applies for this visit.
  }
  apply(preference);
}

// Applies the saved theme, and follows the phone's setting while on
// "system". index.html already set the class before first paint (no light
// flash); this keeps it in sync afterwards.
export function initTheme() {
  apply(getThemePreference());
  window
    .matchMedia?.("(prefers-color-scheme: dark)")
    .addEventListener?.("change", () => {
      if (getThemePreference() === "system") apply("system");
    });
}
