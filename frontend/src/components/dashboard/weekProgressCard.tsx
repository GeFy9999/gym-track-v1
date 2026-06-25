type Props = {
  weekActive: boolean;
  setWeekActive: (week: boolean) => void;
};

export default function WeekProgress({ weekActive, setWeekActive }: Props) {
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 mx-4 mb-6">
      {!weekActive && (
        <>
          <p className="text-base font-semibold text-white text-center mb-1">
            Aucune semaine active
          </p>
          <p className="text-xs text-zinc-500 text-center mb-4">
            Démarre ta semaine pour commencer à suivre tes entraînements
          </p>
          <button
            onClick={() => setWeekActive(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/20"
          >
            Démarrer une nouvelle semaine
          </button>
        </>
      )}
    </div>
  );
}
