import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { X, Dumbbell } from "lucide-react";

type Props = {
  name: string;
  image: string | null;
  peakImage: string | null;
  onClose: () => void;
};

// Crossfades the two static poses (RepDB "start"/"peak") to fake an
// animation — a real licensed GIF isn't available for free, see the
// enrich-exercises-repdb script for context.
const CROSSFADE_INTERVAL_MS = 1200;

export default function ExerciseInfoModal({
  name,
  image,
  peakImage,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [showPeak, setShowPeak] = useState(false);

  useEffect(() => {
    if (!peakImage) return;
    const interval = setInterval(() => {
      setShowPeak((prev) => !prev);
    }, CROSSFADE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [peakImage]);

  // Rendered via a portal: ExerciseCard's slide-in animation leaves a
  // `transform` on the card (fill-mode "both"), which would otherwise turn
  // this `position: fixed` modal into one positioned relative to the card
  // instead of the viewport (a CSS containing-block quirk).
  return createPortal(
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] px-6 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <p className="text-base font-bold text-gray-900 uppercase">
            {name}
          </p>
          <button onClick={onClose}>
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="relative w-full aspect-square rounded-2xl bg-[#faf6f1] overflow-hidden flex items-center justify-center">
          {image ? (
            <>
              <img
                src={image}
                alt={name}
                className="absolute inset-0 w-full h-full object-contain p-4 transition-opacity duration-500"
                style={{ opacity: showPeak ? 0 : 1 }}
              />
              {peakImage && (
                <img
                  src={peakImage}
                  alt={name}
                  className="absolute inset-0 w-full h-full object-contain p-4 transition-opacity duration-500"
                  style={{ opacity: showPeak ? 1 : 0 }}
                />
              )}
            </>
          ) : (
            <Dumbbell size={40} className="text-gray-300" />
          )}
        </div>

        {peakImage && (
          <p className="text-[10px] text-gray-400 text-center mt-3">
            {t("session.exerciseInfo.attribution")}
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
