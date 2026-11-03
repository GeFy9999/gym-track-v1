import { Capacitor } from "@capacitor/core";
import { InAppReview } from "@capacitor-community/in-app-review";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.gymstrack.app";
const LAST_ASKED_KEY = "appReview:lastAsked";

// Asked once someone has actually used the app for a while, then again at
// most every few months: Google caps how often its review card shows and
// never says whether it did, so asking more often than this only burns quota.
const MIN_WORKOUT_DAYS = 3;
const RETRY_AFTER_MS = 90 * 24 * 60 * 60 * 1000;

export const canRateApp = () => Capacitor.getPlatform() === "android";

export function shouldAskForReview(workoutDays: number): boolean {
  if (!canRateApp() || workoutDays < MIN_WORKOUT_DAYS) return false;
  try {
    const lastAsked = Number(localStorage.getItem(LAST_ASKED_KEY) ?? 0);
    return Date.now() - lastAsked >= RETRY_AFTER_MS;
  } catch {
    return false;
  }
}

// Google Play's in-app review card: the rating and comment go straight to
// the store listing. Play policy forbids asking anything beforehand (no
// "do you like the app?" gate), so this is called directly.
export async function askForReview() {
  try {
    localStorage.setItem(LAST_ASKED_KEY, String(Date.now()));
  } catch {
    // Without storage we may ask again next time — Google's quota still applies.
  }
  try {
    await InAppReview.requestReview();
  } catch (err) {
    console.error(err);
  }
}

// The review card can't be summoned on demand (Google may silently skip
// it), so a "Rate the app" button opens the store listing instead. Capacitor
// hands play.google.com links to the system, which opens the Play Store app.
export function openStoreListing() {
  window.location.href = PLAY_STORE_URL;
}
