import { useRef } from "react";
import { useTranslation } from "react-i18next";
import HeaderStats from "../components/stats/header";
import PersonalRecordCards from "../components/stats/personalRecord";
import EstimatedOneRepMax from "../components/stats/estimatedOneRepMax";
import ProgressChart from "../components/stats/progress";
import MuscleVolume from "../components/stats/muscleVolume";
import TourOverlay from "../components/TourOverlay";

export default function StatsPage() {
  const { t } = useTranslation();
  const tourRef0 = useRef<HTMLDivElement>(null);
  const tourRef1 = useRef<HTMLDivElement>(null);
  const tourRef2 = useRef<HTMLDivElement>(null);
  const tourRef3 = useRef<HTMLDivElement>(null);

  const statsTourSteps = [
    {
      title: t("stats.tour.records.title"),
      description: t("stats.tour.records.desc"),
      refIndex: 0,
    },
    {
      title: t("stats.tour.oneRepMax.title"),
      description: t("stats.tour.oneRepMax.desc"),
      refIndex: 1,
    },
    {
      title: t("stats.tour.progression.title"),
      description: t("stats.tour.progression.desc"),
      refIndex: 2,
    },
    {
      title: t("stats.tour.volume.title"),
      description: t("stats.tour.volume.desc"),
      refIndex: 3,
      tooltipPosition: "above" as const,
    },
  ];

  return (
    <div className="pb-28 bg-[#faf6f1] min-h-screen px-5">
      <HeaderStats />

      <section ref={tourRef0} className="mt-7">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
          {t("stats.personalRecords")}
        </h2>
        <PersonalRecordCards />
      </section>

      <section ref={tourRef1} className="mt-8">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
          {t("stats.oneRepMax")}
        </h2>
        <EstimatedOneRepMax />
      </section>

      <section ref={tourRef2} className="mt-8">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
          {t("stats.progression")}
        </h2>
        <ProgressChart />
      </section>

      <section ref={tourRef3} className="mt-8 mb-4">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
          {t("stats.muscleVolume")}
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
