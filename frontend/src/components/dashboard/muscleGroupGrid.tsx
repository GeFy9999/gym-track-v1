import { Link } from "react-router-dom";
import { Dumbbell } from "lucide-react";

const muscleGroups = [
  { name: "Dos", slug: "dos", color: "bg-blue-500/15 text-blue-400" },
  { name: "Pectoraux", slug: "pectoraux", color: "bg-red-500/15 text-red-400" },
  { name: "Biceps", slug: "biceps", color: "bg-amber-500/15 text-amber-400" },
  {
    name: "Triceps",
    slug: "triceps",
    color: "bg-purple-500/15 text-purple-400",
  },
  { name: "Épaules", slug: "epaules", color: "bg-pink-500/15 text-pink-400" },
  { name: "Jambes", slug: "jambes", color: "bg-green-500/15 text-green-400" },
  {
    name: "Avant-bras",
    slug: "avant-bras",
    color: "bg-cyan-500/15 text-cyan-400",
  },
  {
    name: "Trapèzes",
    slug: "trapezes",
    color: "bg-orange-500/15 text-orange-400",
  },
];

type Props = {
  weekActive: boolean;
};

export default function MuscleGroupsCards({ weekActive }: Props) {
  return (
    <div className="px-4">
      <p className="text-base font-semibold text-white mb-4 px-4">
        Groupes musculaires
      </p>
      <div className="grid grid-cols-2 gap-4">
        {muscleGroups.map(({ name, slug, color }) => (
          <Link
            key={slug}
            to={weekActive ? `/${slug}` : "#"}
            onClick={(e) => !weekActive && e.preventDefault()}
            className={`rounded-xl p-4 flex items-center gap-3 transition-colors ${
              weekActive
                ? "bg-zinc-800 border border-zinc-700 hover:border-orange-500/50"
                : "bg-zinc-800/40 border border-zinc-800 opacity-50 cursor-not-allowed"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${color}`}
            >
              <Dumbbell size={18} />
            </div>
            <span className="font-medium text-sm text-zinc-200">{name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
