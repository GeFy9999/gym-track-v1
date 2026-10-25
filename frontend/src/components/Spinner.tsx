type Props = {
  size?: number;
  className?: string;
  label?: string;
};

// The app's loading indicator: a spinning ring in the brand color.
export default function Spinner({ size = 28, className = "", label }: Props) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block animate-spin rounded-full border-[3px] border-[#c9552c]/20 border-t-[#c9552c] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

// Whole-screen variant, for a page that has nothing to show yet.
export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="min-h-screen bg-[#faf6f1] flex items-center justify-center">
      <Spinner size={36} label={label} />
    </div>
  );
}
