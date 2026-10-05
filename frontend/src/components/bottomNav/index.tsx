import { Link, useLocation } from "react-router-dom";
import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Home, BarChart3, History, User, Dumbbell } from "lucide-react";

const links = [
  { to: "/dashboard", labelKey: "nav.home", tourKey: "accueil", icon: Home },
  { to: "/stats", labelKey: "nav.stats", tourKey: "stats", icon: BarChart3 },
  {
    to: "/exercises",
    labelKey: "nav.exercises",
    tourKey: "exercices",
    icon: Dumbbell,
    accent: true,
  },
  {
    to: "/history",
    labelKey: "nav.history",
    tourKey: "historique",
    icon: History,
  },
  { to: "/profil", labelKey: "nav.profile", tourKey: "profil", icon: User },
];

export default function BottomNav() {
  const location = useLocation();
  const { t } = useTranslation();
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const navRef = useRef<HTMLElement>(null);
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

  // Exposes this nav's real rendered height (which already bakes in the
  // safe-area inset) as a CSS variable, so the rest timer can rest just
  // above it instead of either guessing a pixel value or covering it.
  // Cleared on unmount so it falls back to the screen edge when the nav
  // isn't shown (e.g. during a session).
  useLayoutEffect(() => {
    const updateHeight = () => {
      if (navRef.current) {
        document.documentElement.style.setProperty(
          "--bottom-nav-height",
          `${navRef.current.offsetHeight}px`,
        );
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => {
      window.removeEventListener("resize", updateHeight);
      document.documentElement.style.setProperty("--bottom-nav-height", "0px");
    };
  }, []);

  return (
    <nav
      ref={navRef}
      aria-label="Navigation"
      className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 z-50"
    >
      <div
        className="bg-[#ece7dd] px-2 pt-2 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <ul className="relative flex items-center justify-between">
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
                className="relative z-10 flex-1"
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
                    {t(link.labelKey)}
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
