import { Link, useLocation } from "react-router-dom";
import { useLayoutEffect, useRef, useState } from "react";
import { Home, BarChart3, History, User, Dumbbell } from "lucide-react";

const links = [
  { to: "/dashboard", label: "Accueil", tourKey: "accueil", icon: Home },
  { to: "/stats", label: "Stats", tourKey: "stats", icon: BarChart3 },
  {
    to: "/exercises",
    label: "Exercices",
    tourKey: "records",
    icon: Dumbbell,
    accent: true,
  },
  { to: "/history", label: "Histo.", tourKey: "historique", icon: History },
  { to: "/profil", label: "Profil", tourKey: "profil", icon: User },
];

export default function BottomNav() {
  const location = useLocation();
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
  } | null>(null);

  const activeIndex = links.findIndex((l) => l.to === location.pathname);

  useLayoutEffect(() => {
    const el = itemRefs.current[activeIndex];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    } else {
      setIndicator(null);
    }
  }, [activeIndex]);

  return (
    <nav
      aria-label="Navigation"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="bg-[#ece7dd] rounded-2xl px-2 py-2 shadow-sm">
        <ul className="relative flex items-center gap-1">
          {indicator && (
            <div
              className="absolute top-0 h-full bg-[#191714] rounded-xl transition-all duration-300 ease-out"
              style={{ left: indicator.left, width: indicator.width }}
            />
          )}
          {links.map((link, i) => {
            const isActive = i === activeIndex;
            const Icon = link.icon;
            const color = isActive
              ? "text-white"
              : link.accent
                ? "text-[#c9552c]"
                : "text-gray-500";
            return (
              <li
                key={link.to}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                className="relative z-10"
              >
                <Link
                  to={link.to}
                  data-tour={`nav-${link.tourKey}`}
                  className="flex flex-col items-center gap-1 px-3 py-2 whitespace-nowrap"
                >
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className={color}
                  />
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wide ${color}`}
                  >
                    {link.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
