import { Link, useLocation } from "react-router-dom";
import { Home, BarChart3, History, User, Trophy } from "lucide-react";

const links = [
  { to: "/dashboard", label: "Accueil", icon: Home },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/history", label: "Historique", icon: History },
  { to: "/profil", label: "Profil", icon: User },
];

export default function BottomNav() {
  const location = useLocation();

  const renderLink = (link: (typeof links)[number]) => {
    const isActive = location.pathname === link.to;
    const Icon = link.icon;
    return (
      <li key={link.to}>
        <Link
          to={link.to}
          className="flex flex-col items-center gap-1 px-2 py-2.5"
        >
          <Icon
            size={22}
            strokeWidth={isActive ? 2.2 : 1.5}
            className={isActive ? "text-[#c9552c]" : "text-gray-400"}
          />
          {isActive && (
            <div className="w-1.5 h-1.5 rounded-full bg-[#c9552c]" />
          )}
        </Link>
      </li>
    );
  };

  return (
    <nav
      aria-label="Navigation"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[280px]"
    >
      <div className="bg-white rounded-full shadow-[0_2px_20px_rgba(0,0,0,0.12)] border border-gray-100 px-2 py-1.5">
        <ul className="flex w-full justify-around items-center">
          {links.slice(0, 2).map(renderLink)}

          <li>
            <Link
              to="/add-exercise"
              className="flex items-center justify-center w-11 h-11 rounded-full bg-[#c9552c]"
            >
              <Trophy size={22} className="text-white" strokeWidth={2.5} />
            </Link>
          </li>

          {links.slice(2).map(renderLink)}
        </ul>
      </div>
    </nav>
  );
}
