import { useCallback, useEffect, useRef, useState } from "react";
import i18n from "../i18n";

const NOTIFICATION_ICON = "/icon192_maskable.png";
const VIBRATION_PATTERN = [200, 100, 200];

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

export function useRestTimer(defaultSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const skip = useCallback(() => {
    clearTimer();
    setIsActive(false);
    setSecondsLeft(0);
  }, [clearTimer]);

  const handleTimerEnd = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(VIBRATION_PATTERN);
    }
    if (audioCtxRef.current) {
      playBeep(audioCtxRef.current);
    }
    notifyRestOver();
  }, []);

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

      clearTimer();
      setSecondsLeft(total);
      setTotalSeconds(total);
      setIsActive(true);

      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearTimer();
            setIsActive(false);
            handleTimerEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [defaultSeconds, clearTimer, handleTimerEnd],
  );

  const adjustSeconds = useCallback(
    (delta: number) => {
      if (!isActive) return;
      setSecondsLeft((prev) => {
        const next = Math.max(0, Math.min(600, prev + delta));
        if (next <= 0) {
          clearTimer();
          setIsActive(false);
          handleTimerEnd();
        }
        setTotalSeconds((total) => Math.max(total, next));
        return next;
      });
    },
    [isActive, clearTimer, handleTimerEnd],
  );

  useEffect(() => clearTimer, [clearTimer]);

  return { secondsLeft, totalSeconds, isActive, start, skip, adjustSeconds };
}
