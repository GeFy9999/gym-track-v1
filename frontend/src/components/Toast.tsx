import { Check } from "lucide-react";

type Props = {
  message: string;
  closing: boolean;
};

export default function Toast({ message, closing }: Props) {
  return (
    <div
      className={`fixed bottom-24 left-1/2 z-[60] bg-gray-900 text-white rounded-full shadow-lg pl-3 pr-4 py-2.5 flex items-center gap-2 ${
        closing ? "animate-toast-out" : "animate-toast-in"
      }`}
    >
      <span className="w-5 h-5 rounded-full bg-[#c9552c] flex items-center justify-center flex-shrink-0">
        <Check size={12} strokeWidth={3} />
      </span>
      <span className="text-sm font-semibold whitespace-nowrap">{message}</span>
    </div>
  );
}
