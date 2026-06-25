type LastSession = {
  exerciseName: string;
  weight: number;
  reps: number;
  diff: number;
} | null;

export default function RecentActivity() {
  const lastSession: LastSession = {
    exerciseName: "Lat pulldown",
    weight: 100,
    reps: 8,
    diff: 5,
  };

  return (
    <div className="px-4 mt-6">
      <p className="text-base font-semibold text-white mb-4">Dernière séance</p>

      {lastSession ? (
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-zinc-200">
              {lastSession.exerciseName}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {lastSession.weight} lb × {lastSession.reps} reps
            </p>
          </div>
          {lastSession.diff !== 0 && (
            <span
              className={`text-xs font-semibold ${
                lastSession.diff > 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {lastSession.diff > 0 ? "+" : ""}
              {lastSession.diff} lb
            </span>
          )}
        </div>
      ) : (
        <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl p-5 text-center">
          <p className="text-sm text-zinc-500">Aucun historique encore</p>
        </div>
      )}
    </div>
  );
}
