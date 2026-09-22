let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  try {
    if (!ctx) {
      const AudioCtxCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtxCtor) return null;
      ctx = new AudioCtxCtor();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function playNote(
  audioCtx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
) {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.22, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

// Two-note ascending chime (C6 -> E6), like a classic confirm/checkmark sound.
export function playSetCompleteSound() {
  const audioCtx = getContext();
  if (!audioCtx) return;

  try {
    const now = audioCtx.currentTime;
    playNote(audioCtx, 1046.5, now, 0.12);
    playNote(audioCtx, 1318.5, now + 0.09, 0.18);
  } catch {
    // Audio isn't critical — never let it break set completion.
  }
}
