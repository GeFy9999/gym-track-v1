import { useRef } from "react";
import HeaderStats from "../components/stats/header";
import PersonalRecordCards from "../components/stats/personalRecord";
import EstimatedOneRepMax from "../components/stats/estimatedOneRepMax";
import ProgressChart from "../components/stats/progress";
import MuscleVolume from "../components/stats/muscleVolume";
import TourOverlay from "../components/TourOverlay";

export default function StatsPage() {
  const tourRef0 = useRef<HTMLDivElement>(null);
  const tourRef1 = useRef<HTMLDivElement>(null);
  const tourRef2 = useRef<HTMLDivElement>(null);
  const tourRef3 = useRef<HTMLDivElement>(null);

  const statsTourSteps = [
    {
      title: "Records personnels",
      description:
        "Le meilleur poids jamais soulevé pour chaque exercice que tu suis (active le trophée sur une carte d'exercice pour l'ajouter ici).",
      refIndex: 0,
    },
    {
      title: "Force maximale estimée par 1 répétition",
      description:
        "Ton 1RM estimé (formule d'Epley) pour chaque exercice suivi, avec sa progression dans le temps.",
      refIndex: 1,
    },
    {
      title: "Progression",
      description: "L'évolution de ton poids corporel au fil des semaines.",
      refIndex: 2,
    },
    {
      title: "Volume par groupe musculaire",
      description:
        "Le nombre de sets effectués par groupe musculaire, pour voir où va ton volume d'entraînement.",
      refIndex: 3,
      tooltipPosition: "above" as const,
    },
  ];

  return (
    <div className="pb-28 bg-[#faf6f1] min-h-screen px-5">
      <HeaderStats />

      <section ref={tourRef0} className="mt-7">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
          Records personnels
        </h2>
        <PersonalRecordCards />
      </section>

      <section ref={tourRef1} className="mt-8">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
          Force maximale estimée · 1RM
        </h2>
        <EstimatedOneRepMax />
      </section>

      <section ref={tourRef2} className="mt-8">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
          Progression
        </h2>
        <ProgressChart />
      </section>

      <section ref={tourRef3} className="mt-8 mb-4">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
          Volume par groupe musculaire
        </h2>
        <MuscleVolume />
      </section>

      <TourOverlay
        tourKey="stats"
        steps={statsTourSteps}
        refs={[tourRef0, tourRef1, tourRef2, tourRef3]}
      />
    </div>
  );
}
