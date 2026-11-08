import PhoneFrame from "./PhoneFrame";

type Props = {
  src: string;
  label: string;
};

// The recordings' size, and the height of the phone's status bar baked into
// them (clock, screen-recording dot, battery) — hidden by cropping it off.
const VIDEO_WIDTH = 576;
const VIDEO_HEIGHT = 1248;
const STATUS_BAR_HEIGHT = 48;

// A real screen recording of the app, looping silently inside a phone frame.
// The screen keeps the recording's ratio minus the status bar, so nothing
// else is cropped or letterboxed.
export default function PhoneVideo({ src, label }: Props) {
  return (
    <PhoneFrame aspectRatio={`${VIDEO_WIDTH} / ${VIDEO_HEIGHT - STATUS_BAR_HEIGHT}`}>
      <video
        src={src}
        aria-label={label}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="block w-full h-auto"
        // A negative margin in % is relative to the width, which is what
        // the status bar's height scales with.
        style={{ marginTop: `-${(STATUS_BAR_HEIGHT / VIDEO_WIDTH) * 100}%` }}
      />
    </PhoneFrame>
  );
}
