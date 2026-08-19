import { Link, useLocation } from "react-router-dom";
import { Home, BarChart3, History, User, Plus } from "lucide-react";

const links = [
  { to: "/dashboard", label: "Acceuil", icon: Home },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/history", label: "Historique", icon: History },
  { to: "/profil", label: "Profile", icon: User },
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
          className="flex flex-col items-center gap-1 px-4 py-2"
        >
          <Icon
            size={22}
            className={isActive ? "text-orange-500" : "text-gray-400"}
          />
          {isActive && (
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          )}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Navigation" className="fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] px-2 py-1">
        <ul className="flex w-full justify-around items-center">
          {links.slice(0, 2).map(renderLink)}

          <li>
            <Link
              to="/add-exercise"
              className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-500 shadow-md shadow-orange-500/30"
            >
              <Plus size={24} className="text-white" />
            </Link>
          </li>

          {links.slice(2).map(renderLink)}
        </ul>
      </div>
    </nav>
  );
}
