import HeaderStats from "../components/stats/header";
import PersonalRecordCards from "../components/stats/personalRecord";
import ProgressChart from "../components/stats/progress";
import MuscleVolume from "../components/stats/muscleVolume";

export default function StatsPage() {
  return (
    <div className="pb-24 bg-gray-50 min-h-screen px-4">
      <HeaderStats />

      <section className="mt-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          Records personnels
        </h2>
        <PersonalRecordCards />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Progression</h2>
        <ProgressChart />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          Volume par groupe musculaire
        </h2>
        <MuscleVolume />
      </section>
    </div>
  );
}
