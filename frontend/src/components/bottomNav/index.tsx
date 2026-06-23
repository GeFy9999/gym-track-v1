import { Link, useLocation } from "react-router-dom";
import { Home, BarChart3, History, User, Plus } from "lucide-react";

const links = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/history", label: "History", icon: History },
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
          className="flex flex-col items-center gap-1 px-3 py-1"
        >
          <Icon
            size={22}
            className={isActive ? "text-orange-500" : "text-slate-400"}
          />
          <span
            className={`text-xs ${
              isActive ? "text-orange-500 font-semibold" : "text-slate-400"
            }`}
          >
            {link.label}
          </span>
        </Link>
      </li>
    );
  };

  return (
    <nav
      aria-label="Navigation"
      className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 flex justify-around items-center py-2 px-4 z-50"
    >
      <ul className="flex w-full justify-around items-center">
        {links.slice(0, 2).map(renderLink)}

        <li>
          <button className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-500 text-white -mt-6 shadow-lg">
            <Plus size={24} />
          </button>
        </li>

        {links.slice(2).map(renderLink)}
      </ul>
    </nav>
  );
}
