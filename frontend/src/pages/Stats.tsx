import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Camera, ChevronRight, Crown } from "lucide-react";
import HeaderStats from "../components/stats/header";
import PersonalRecordCards from "../components/stats/personalRecord";
import EstimatedOneRepMax from "../components/stats/estimatedOneRepMax";
import ProgressChart from "../components/stats/progress";
import MuscleVolume from "../components/stats/muscleVolume";
import TourOverlay from "../components/TourOverlay";
import { useIsPro } from "../hooks/useIsPro";
import { ProGateOrContent } from "../components/ProGate";

export default function StatsPage() {
  const { t } = useTranslation();
  const { isPro } = useIsPro();
  const navigate = useNavigate();
  const tourRef0 = useRef<HTMLDivElement>(null);
  const tourRef1 = useRef<HTMLDivElement>(null);
  const tourRef2 = useRef<HTMLDivElement>(null);
  const tourRef3 = useRef<HTMLDivElement>(null);
  const tourRef4 = useRef<HTMLDivElement>(null);

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
      title: t("stats.tour.progressPhotos.title"),
      description: t("stats.tour.progressPhotos.desc"),
      refIndex: 4,
    },
    {
      title: t("stats.tour.volume.title"),
      description: t("stats.tour.volume.desc"),
      refIndex: 3,
      tooltipPosition: "above" as const,
    },
  ];

  return (
    <div className="pb-28 bg-[#faf6f1] min-h-screen">
      <HeaderStats />

      <section ref={tourRef0} className="mt-7 px-page">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
          {t("stats.personalRecords")}
        </h2>
        <PersonalRecordCards />
      </section>

      <section ref={tourRef1} className="mt-8 px-page">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
          {t("stats.oneRepMax")}
        </h2>
        <ProGateOrContent isPro={isPro} goProLabel={t("upgrade.goPro")}>
          <EstimatedOneRepMax isPro={isPro} />
        </ProGateOrContent>
      </section>

      <section ref={tourRef2} className="mt-8 px-page">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
          {t("stats.progression")}
        </h2>
        <ProgressChart />
      </section>

      <section ref={tourRef4} className="mt-8 px-page">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
          {t("stats.progressPhotos")}
        </h2>
        <button
          onClick={() => navigate(isPro ? "/progression" : "/upgrade")}
          className="w-full flex items-center gap-3 px-4 py-4 bg-[#ece7dd] rounded-2xl shadow-sm"
        >
          <div className="icon-tile w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
            <Camera size={16} className="text-[#c9552c]" />
          </div>
          <p className="flex-1 text-left text-sm font-bold text-gray-900 uppercase">
            {t("stats.progressPhotos")}
          </p>
          <span className="text-[10px] font-bold text-gray-600 uppercase bg-white/60 px-2.5 py-1 rounded-full flex items-center gap-1">
            {isPro ? t("stats.view") : <Crown size={10} />}
          </span>
          <ChevronRight size={16} className="text-[#c9552c] flex-shrink-0" />
        </button>
      </section>

      <section ref={tourRef3} className="mt-8 mb-4 px-page">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
          {t("stats.muscleVolume")}
        </h2>
        <ProGateOrContent isPro={isPro} goProLabel={t("upgrade.goPro")}>
          <MuscleVolume isPro={isPro} />
        </ProGateOrContent>
      </section>

      <TourOverlay
        tourKey="stats"
        steps={statsTourSteps}
        refs={[tourRef0, tourRef1, tourRef2, tourRef3, tourRef4]}
      />
    </div>
  );
}
