import { createPortal } from "react-dom";
import { X, Dumbbell } from "lucide-react";

type Props = {
  name: string;
  image: string | null;
  videoUrl: string | null;
  onClose: () => void;
};

export default function ExerciseInfoModal({
  name,
  image,
  videoUrl,
  onClose,
}: Props) {
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
          {videoUrl ? (
            <video
              src={videoUrl}
              className="absolute inset-0 w-full h-full object-contain"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : image ? (
            <img
              src={image}
              alt={name}
              className="absolute inset-0 w-full h-full object-contain p-4"
            />
          ) : (
            <Dumbbell size={40} className="text-gray-300" />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
