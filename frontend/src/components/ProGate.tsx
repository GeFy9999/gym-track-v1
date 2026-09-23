import { useNavigate } from "react-router-dom";
import { Crown } from "lucide-react";

export function ProGate({
  children,
  goProLabel,
}: {
  children: React.ReactNode;
  goProLabel: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="relative">
      <div className="blur-[3px] opacity-50 pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          onClick={() => navigate("/upgrade")}
          className="flex items-center gap-1.5 bg-gray-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg active:scale-[0.97] transition-transform"
        >
          <Crown size={13} /> {goProLabel}
        </button>
      </div>
    </div>
  );
}

export function ProGateOrContent({
  isPro,
  children,
  goProLabel,
}: {
  isPro: boolean;
  children: React.ReactNode;
  goProLabel: string;
}) {
  if (isPro) return <>{children}</>;
  return <ProGate goProLabel={goProLabel}>{children}</ProGate>;
}
