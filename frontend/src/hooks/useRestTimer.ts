import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { LocalNotifications } from "@capacitor/local-notifications";
import i18n from "../i18n";

const NOTIFICATION_ICON = "/icon192_maskable.png";
const VIBRATION_PATTERN = [200, 100, 200];
// Fixed id so scheduling a new rest timer always replaces any pending one
// instead of stacking duplicate notifications.
const REST_TIMER_NOTIFICATION_ID = 78210;

let nativePermissionChecked = false;

// Android throttles/suspends the page's setInterval once the app is
// backgrounded (screen off, user switched apps), so the in-app timer alone
// can't be trusted to fire on time — scheduling a real OS-level local
// notification is what actually survives that.
async function scheduleNativeRestOverNotification(seconds: number) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    if (!nativePermissionChecked) {
      nativePermissionChecked = true;
      const { display } = await LocalNotifications.checkPermissions();
      if (display !== "granted") {
        await LocalNotifications.requestPermissions();
      }
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: REST_TIMER_NOTIFICATION_ID,
          title: i18n.t("session.restOverNotification.title"),
          body: i18n.t("session.restOverNotification.body"),
          schedule: { at: new Date(Date.now() + seconds * 1000) },
        },
      ],
    });
  } catch {
    // Scheduling is a best-effort enhancement — never let it break the timer.
  }
}

function cancelNativeRestOverNotification() {
  if (!Capacitor.isNativePlatform()) return;
  LocalNotifications.cancel({
    notifications: [{ id: REST_TIMER_NOTIFICATION_ID }],
  }).catch(() => {});
}

function playBeep(ctx: AudioContext) {
  try {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.6);
  } catch {
    // Audio isn't critical to the feature — never let it break the timer.
  }
}

function notifyRestOver() {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;

  const title = i18n.t("session.restOverNotification.title");
  // `vibrate` triggers device vibration from the notification itself, which
  // keeps working even when the screen is off (unlike navigator.vibrate()).
  const options: NotificationOptions & { vibrate?: number[] } = {
    body: i18n.t("session.restOverNotification.body"),
    icon: NOTIFICATION_ICON,
    tag: "rest-timer",
    vibrate: VIBRATION_PATTERN,
  };

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => reg.showNotification(title, options))
      .catch(() => new Notification(title, options));
  } else {
    new Notification(title, options);
  }
}

// How often the remaining time is re-read from the clock. Faster than once a
// second so the displayed value never visibly skips a second when a tick
// lands late.
const TICK_MS = 250;

export function useRestTimer(defaultSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  // When the rest ends (ms timestamp). The remaining time is always derived
  // from this rather than counted down tick by tick: Android pauses the
  // WebView's timers while the app is in the background, so a countdown
  // would freeze there and still be running when the user comes back,
  // long after the OS notification told them the rest was over.
  const endAtRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const skip = useCallback(() => {
    clearTimer();
    endAtRef.current = null;
    setIsActive(false);
    setSecondsLeft(0);
    cancelNativeRestOverNotification();
  }, [clearTimer]);

  const handleTimerEnd = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(VIBRATION_PATTERN);
    }
    if (audioCtxRef.current) {
      playBeep(audioCtxRef.current);
    }
    // On native, the OS-scheduled local notification (set up in `start`) is
    // the reliable signal — the Web Notification API isn't trustworthy
    // inside an Android WebView and would just duplicate it.
    if (!Capacitor.isNativePlatform()) {
      notifyRestOver();
    }
  }, []);

  // Re-reads the remaining time from the clock. `returning` is set when the
  // app/tab comes back to the foreground.
  const sync = useCallback(
    (returning = false) => {
      const endAt = endAtRef.current;
      if (endAt === null) return;

      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      if (left > 0) {
        setSecondsLeft(left);
        return;
      }

      endAtRef.current = null;
      clearTimer();
      setIsActive(false);
      setSecondsLeft(0);
      // Ended while the native app was in the background: the OS
      // notification already rang, so just close the timer quietly
      // instead of beeping late when the user comes back.
      const endedInBackground =
        Capacitor.isNativePlatform() && (returning || document.hidden);
      if (!endedInBackground) handleTimerEnd();
    },
    [clearTimer, handleTimerEnd],
  );

  const runTicker = useCallback(() => {
    clearTimer();
    intervalRef.current = setInterval(() => sync(), TICK_MS);
  }, [clearTimer, sync]);

  // Catch up the moment the app is back on screen, without waiting for the
  // next tick (which, after a background pause, may take a moment to come).
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") sync(true);
    };
    document.addEventListener("visibilitychange", onVisible);

    let disposed = false;
    let removeResume: (() => void) | undefined;
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener("resume", () => sync(true))
        .then((handle) => {
          // Unmounted before the listener finished registering.
          if (disposed) handle.remove();
          else removeResume = () => handle.remove();
        })
        .catch(() => {});
    }

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisible);
      removeResume?.();
    };
  }, [sync]);

  const start = useCallback(
    (seconds?: number) => {
      const total = seconds ?? defaultSeconds;
      if (total <= 0) return;

      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "default"
      ) {
        Notification.requestPermission().catch(() => {});
      }

      // Create/resume the AudioContext synchronously inside this
      // user-gesture-triggered call, so browsers still allow it to play a
      // beep later when the timer actually ends (no gesture at that point).
      try {
        const AudioCtxCtor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (AudioCtxCtor && !audioCtxRef.current) {
          audioCtxRef.current = new AudioCtxCtor();
        }
        audioCtxRef.current?.resume().catch(() => {});
      } catch {
        // Audio isn't critical to the feature — never let it break the timer.
      }

      endAtRef.current = Date.now() + total * 1000;
      setSecondsLeft(total);
      setTotalSeconds(total);
      setIsActive(true);
      scheduleNativeRestOverNotification(total);
      runTicker();
    },
    [defaultSeconds, runTicker],
  );

  const adjustSeconds = useCallback(
    (delta: number) => {
      const endAt = endAtRef.current;
      if (!isActive || endAt === null) return;

      const current = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      const next = Math.max(0, Math.min(600, current + delta));
      if (next <= 0) {
        endAtRef.current = null;
        clearTimer();
        setIsActive(false);
        setSecondsLeft(0);
        handleTimerEnd();
        cancelNativeRestOverNotification();
        return;
      }

      endAtRef.current = Date.now() + next * 1000;
      setSecondsLeft(next);
      setTotalSeconds((total) => Math.max(total, next));
      scheduleNativeRestOverNotification(next);
    },
    [isActive, clearTimer, handleTimerEnd],
  );

  useEffect(() => clearTimer, [clearTimer]);

  return { secondsLeft, totalSeconds, isActive, start, skip, adjustSeconds };
}
