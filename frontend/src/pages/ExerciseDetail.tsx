import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Dumbbell,
  Layers,
  TrendingUp,
  Trophy,
  Lock,
} from "lucide-react";
import { API_URL } from "../lib/api";
import { useTrackedExercises } from "../hooks/useTrackedExercises";
import { getWeightUnit, convertWeight, roundWeight } from "../utils/units";
import ProgressLineChart from "../components/charts/ProgressLineChart";

type Exercise = {
  id: string;
  name: string;
  image: string | null;
  muscleGroup: { id: string; name: string };
};

type ExerciseNote = { id: string; exerciseId: string; note: string };

type HistorySet = { weight: number; reps: number; unit: string; type: string };
type HistoryEntry = {
  sessionId: string;
  date: string;
  muscleGroup: string;
  sets: HistorySet[];
};

type RecordPoint = { weight: number; reps: number; date: string };
type VolumePoint = { weight: number; reps: number; volume: number; date: string };

type ExerciseHistoryResponse = {
  history: HistoryEntry[];
  records: {
    bestWeight: RecordPoint | null;
    bestVolume: VolumePoint | null;
    bestOneRepMax: (RecordPoint & { oneRepMax: number }) | null;
    byReps: { reps: number; weight: number }[];
    volumeOverTime: { date: string; volume: number }[];
    oneRepMaxOverTime: { date: string; oneRepMax: number }[];
  };
};

// Pro gating is disabled for now so every feature can be tested freely.
// Flip this back to `false` (and the real Stripe-backed check comes later)
// to re-enable the lock/blur treatment on Pro sections.
const IS_PRO = true;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function summarizeSets(sets: HistorySet[]): string {
  if (sets.length === 0) return "";
  const [first] = sets;
  const allSame = sets.every(
    (s) => s.weight === first.weight && s.reps === first.reps,
  );
  if (allSame) {
    return `${sets.length}×${first.reps} @ ${first.weight} ${first.unit}`;
  }
  return sets.map((s) => `${s.weight}×${s.reps}`).join(", ");
}

function RecordRow({
  icon,
  value,
  label,
  detail,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  detail?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#c9552c]/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-lg font-black text-gray-900">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
      {detail && (
        <p className="text-xs text-gray-400 flex-shrink-0">{detail}</p>
      )}
    </div>
  );
}

function ProGate({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="blur-[3px] opacity-50 pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          onClick={() => {}}
          className="flex items-center gap-1.5 bg-gray-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg active:scale-[0.97] transition-transform"
        >
          <Lock size={13} /> Passer à Pro
        </button>
      </div>
    </div>
  );
}

export default function ExerciseDetailPage() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { isTracked, fetchTracked, toggleTracked } = useTrackedExercises();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [note, setNote] = useState<string>("");
  const [data, setData] = useState<ExerciseHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [trophyPopping, setTrophyPopping] = useState(false);

  useEffect(() => {
    if (!exerciseId) return;
    const token = localStorage.getItem("token");

    const fetchData = async () => {
      try {
        const [exRes, notesRes, historyRes] = await Promise.all([
          fetch(`${API_URL}/exercises`),
          token
            ? fetch(`${API_URL}/exercise-notes`, {
                headers: { Authorization: `Bearer ${token}` },
              })
            : Promise.resolve(null),
          fetch(`${API_URL}/sessions/me/exercise-history/${exerciseId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (exRes.ok) {
          const all: Exercise[] = await exRes.json();
          setExercise(all.find((e) => e.id === exerciseId) ?? null);
        }
        if (notesRes && notesRes.ok) {
          const notes: ExerciseNote[] = await notesRes.json();
          setNote(notes.find((n) => n.exerciseId === exerciseId)?.note ?? "");
        }
        if (historyRes.ok) {
          setData(await historyRes.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchTracked();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf6f1] px-5 pb-16">
        <div className="pt-6 pb-4 flex items-center gap-3 animate-pulse">
          <div className="w-9 h-9 rounded-full bg-gray-200" />
          <div className="h-6 w-40 bg-gray-200 rounded" />
        </div>
        <div className="h-48 bg-gray-200 rounded-2xl mb-4 animate-pulse" />
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white border border-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!exercise || !data) {
    return (
      <div className="min-h-screen bg-[#faf6f1] flex items-center justify-center">
        <p className="text-red-400">Exercice introuvable</p>
      </div>
    );
  }

  const { records, history } = data;
  // Sets are stored in whatever unit was active when they were logged. This
  // page always displays in the user's *current* weight unit setting, so
  // every value gets converted from the recorded unit to that one — the
  // profile's lb/kg switch is reflected here even for old data.
  const recordedUnit = history[0]?.sets[0]?.unit ?? "lb";
  const unit = getWeightUnit();
  const conv = (w: number) => roundWeight(convertWeight(w, recordedUnit, unit));

  const convertedHistory = history.map((entry) => ({
    ...entry,
    sets: entry.sets.map((s) => ({ ...s, weight: conv(s.weight), unit })),
  }));
  const visibleHistory = IS_PRO
    ? convertedHistory
    : convertedHistory.slice(0, 5);

  const convertedRecords = {
    bestWeight: records.bestWeight
      ? { ...records.bestWeight, weight: conv(records.bestWeight.weight) }
      : null,
    bestVolume: records.bestVolume
      ? {
          ...records.bestVolume,
          weight: conv(records.bestVolume.weight),
          volume: conv(records.bestVolume.volume),
        }
      : null,
    bestOneRepMax: records.bestOneRepMax
      ? {
          ...records.bestOneRepMax,
          weight: conv(records.bestOneRepMax.weight),
          oneRepMax: conv(records.bestOneRepMax.oneRepMax),
        }
      : null,
    byReps: records.byReps.map((r) => ({ ...r, weight: conv(r.weight) })),
    volumeOverTime: records.volumeOverTime.map((p) => ({
      ...p,
      volume: conv(p.volume),
    })),
    oneRepMaxOverTime: records.oneRepMaxOverTime.map((p) => ({
      ...p,
      oneRepMax: conv(p.oneRepMax),
    })),
  };

  return (
    <div className="min-h-screen bg-[#faf6f1] pb-16">
      <div className="flex items-center justify-between gap-3 px-5 pt-6 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center active:bg-gray-300 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={16} className="text-gray-700" />
          </button>
          <h1 className="text-xl font-black text-gray-900 leading-tight truncate">
            {exercise.name}
          </h1>
        </div>
        <button
          onClick={() => {
            toggleTracked(exercise.id);
            setTrophyPopping(true);
          }}
          onAnimationEnd={() => setTrophyPopping(false)}
          aria-label="Suivre en record personnel"
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
            isTracked(exercise.id)
              ? "bg-[#c9552c] text-white"
              : "bg-white border border-gray-200 text-gray-400"
          }`}
        >
          <Trophy
            size={18}
            className={trophyPopping ? "animate-trophy-pop" : ""}
          />
        </button>
      </div>

      <div className="px-5 space-y-4">
        {exercise.image ? (
          <img
            src={exercise.image}
            alt=""
            className="w-full h-48 object-cover rounded-2xl"
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 rounded-2xl flex items-center justify-center">
            <Dumbbell size={36} className="text-gray-300" />
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700">
            {exercise.muscleGroup.name}
          </span>
        </div>

        {note && (
          <div className="bg-[#c9552c]/5 border border-[#c9552c]/20 rounded-2xl px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#c9552c] mb-1">
              Ta note
            </p>
            <p className="text-sm text-gray-700">{note}</p>
          </div>
        )}

        <div>
          <p className="text-[15px] font-bold text-gray-900 mb-2">
            Records personnels
          </p>
          <div className="space-y-2">
            {convertedRecords.bestWeight ? (
              <RecordRow
                icon={<Dumbbell size={18} className="text-[#c9552c]" />}
                value={`${convertedRecords.bestWeight.weight} ${unit}`}
                label="Meilleur poids"
                detail={formatDate(convertedRecords.bestWeight.date)}
              />
            ) : (
              <RecordRow
                icon={<Dumbbell size={18} className="text-[#c9552c]" />}
                value={`-- ${unit}`}
                label="Meilleur poids"
              />
            )}
            {convertedRecords.bestVolume ? (
              <RecordRow
                icon={<Layers size={18} className="text-[#c9552c]" />}
                value={`${convertedRecords.bestVolume.weight} ${unit} × ${convertedRecords.bestVolume.reps}`}
                label={`Meilleur volume (${convertedRecords.bestVolume.volume} ${unit})`}
                detail={formatDate(convertedRecords.bestVolume.date)}
              />
            ) : (
              <RecordRow
                icon={<Layers size={18} className="text-[#c9552c]" />}
                value={`-- ${unit}`}
                label="Meilleur volume"
              />
            )}
            {convertedRecords.bestOneRepMax ? (
              <RecordRow
                icon={<TrendingUp size={18} className="text-[#c9552c]" />}
                value={`${Math.round(convertedRecords.bestOneRepMax.oneRepMax)} ${unit} (estimé)`}
                label={`Via ${convertedRecords.bestOneRepMax.weight} ${unit} × ${convertedRecords.bestOneRepMax.reps}`}
                detail={formatDate(convertedRecords.bestOneRepMax.date)}
              />
            ) : (
              <RecordRow
                icon={<TrendingUp size={18} className="text-[#c9552c]" />}
                value={`-- ${unit}`}
                label="1RM estimé"
              />
            )}
          </div>
        </div>

        <div>
          <p className="text-[15px] font-bold text-gray-900 mb-2 flex items-center gap-1.5">
            Records par répétitions
            {!IS_PRO && <Lock size={13} className="text-gray-400" />}
          </p>
          {convertedRecords.byReps.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">
              Pas encore de données
            </p>
          ) : (
            <ProGateOrContent isPro={IS_PRO}>
              <div className="space-y-1.5">
                {convertedRecords.byReps.map((r) => (
                  <div
                    key={r.reps}
                    className="flex items-center justify-between text-sm bg-white border border-gray-200 rounded-xl px-3.5 py-2.5"
                  >
                    <span className="text-gray-500">
                      {r.reps} rep{r.reps > 1 ? "s" : ""}
                    </span>
                    <span className="font-bold text-gray-900">
                      {r.weight} {unit}
                    </span>
                  </div>
                ))}
              </div>
            </ProGateOrContent>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <ProGateOrContent isPro={IS_PRO}>
            <ProgressLineChart
              title="Volume total"
              subtitle={`Par séance (${unit})`}
              points={convertedRecords.volumeOverTime.map((p) => ({
                date: p.date,
                value: p.volume,
              }))}
            />
          </ProGateOrContent>
          {!IS_PRO && (
            <div className="flex items-center gap-1 mt-2">
              <Lock size={11} className="text-gray-400" />
              <span className="text-[10px] text-gray-400">Fonctionnalité Pro</span>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <ProGateOrContent isPro={IS_PRO}>
            <ProgressLineChart
              title="1RM estimé"
              subtitle={`Meilleur set (${unit})`}
              points={convertedRecords.oneRepMaxOverTime.map((p) => ({
                date: p.date,
                value: p.oneRepMax,
              }))}
            />
          </ProGateOrContent>
          {!IS_PRO && (
            <div className="flex items-center gap-1 mt-2">
              <Lock size={11} className="text-gray-400" />
              <span className="text-[10px] text-gray-400">Fonctionnalité Pro</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-[15px] font-bold text-gray-900 mb-2">
            Historique des séances
          </p>
          {history.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">
              Aucune séance avec cet exercice pour l'instant
            </p>
          ) : (
            <div className="space-y-2">
              {visibleHistory.map((entry) => (
                <button
                  key={entry.sessionId}
                  onClick={() =>
                    navigate(`/session/${entry.sessionId}?readonly=true`)
                  }
                  className="w-full bg-white border border-gray-200 rounded-2xl p-3.5 text-left shadow-sm active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(entry.date)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {entry.sets.length} set{entry.sets.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {summarizeSets(entry.sets)}
                  </p>
                </button>
              ))}
              {!IS_PRO && history.length > 5 && (
                <p className="text-xs text-gray-400 text-center py-2 flex items-center justify-center gap-1.5">
                  <Lock size={12} /> Historique complet avec Pro
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProGateOrContent({
  isPro,
  children,
}: {
  isPro: boolean;
  children: React.ReactNode;
}) {
  if (isPro) return <>{children}</>;
  return <ProGate>{children}</ProGate>;
}
