import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  Download,
  Check,
  AlertTriangle,
  Search,
  Plus,
} from "lucide-react";
import { API_URL } from "../lib/api";
import { getWeightUnit } from "../utils/units";
import { getDateLocale } from "../i18n";
import {
  parseStrongCsv,
  getUniqueExerciseNames,
  getDateRange,
  type ParsedWorkout,
} from "../utils/strongCsv";
import {
  matchExerciseName,
  stripEquipmentSuffix,
  type ExerciseCandidate,
  type MatchSuggestion,
} from "../utils/exerciseMatch";

type MuscleGroup = { id: string; name: string };

type Resolution = { exerciseId: string; muscleGroupName: string };

type Step = "upload" | "preview" | "mapping" | "confirm" | "done";

export default function ImportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const token = localStorage.getItem("token");

  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  const [workouts, setWorkouts] = useState<ParsedWorkout[]>([]);
  const [exercises, setExercises] = useState<ExerciseCandidate[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [weightUnit, setWeightUnit] = useState(getWeightUnit());

  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({});
  const [suggestionsByName, setSuggestionsByName] = useState<
    Record<string, MatchSuggestion[]>
  >({});
  const [customDrafts, setCustomDrafts] = useState<
    Record<string, { name: string; muscleGroupId: string }>
  >({});
  const [savingCustomFor, setSavingCustomFor] = useState<string | null>(null);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    importBatchId: string;
    sessionsCreated: number;
    setsCreated: number;
  } | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [undone, setUndone] = useState(false);

  const uniqueNames = useMemo(() => getUniqueExerciseNames(workouts), [workouts]);
  const dateRange = useMemo(() => getDateRange(workouts), [workouts]);
  const unresolvedNames = uniqueNames.filter((n) => !resolutions[n]);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const processFile = async (file: File) => {
    setError(null);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError(t("import.errorCsvOnly"));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(t("import.errorFileTooLarge"));
      return;
    }

    setParsing(true);

    try {
      const text = await file.text();
      const parsedWorkouts = parseStrongCsv(text);
      if (parsedWorkouts.length === 0) {
        setError(t("import.errorNoData"));
        setParsing(false);
        return;
      }

      const [exercisesRes, muscleGroupsRes] = await Promise.all([
        fetch(`${API_URL}/exercises`),
        fetch(`${API_URL}/muscleGroups`),
      ]);
      if (!exercisesRes.ok || !muscleGroupsRes.ok) {
        throw new Error(t("import.errorLoadExercises"));
      }
      const allExercises: ExerciseCandidate[] = await exercisesRes.json();
      const allMuscleGroups: MuscleGroup[] = await muscleGroupsRes.json();

      const names = getUniqueExerciseNames(parsedWorkouts);
      const nextResolutions: Record<string, Resolution> = {};
      const nextSuggestions: Record<string, MatchSuggestion[]> = {};

      for (const name of names) {
        const result = matchExerciseName(name, allExercises);
        if (result.status === "matched") {
          nextResolutions[name] = {
            exerciseId: result.exercise.id,
            muscleGroupName: result.exercise.muscleGroup.name,
          };
        } else {
          nextSuggestions[name] = result.suggestions;
        }
      }

      setWorkouts(parsedWorkouts);
      setExercises(allExercises);
      setMuscleGroups(allMuscleGroups);
      setResolutions(nextResolutions);
      setSuggestionsByName(nextSuggestions);
      setStep("preview");
    } catch (err) {
      console.error(err);
      setError(t("import.errorReadFile"));
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const resolveWith = (name: string, exercise: ExerciseCandidate) => {
    setResolutions((prev) => ({
      ...prev,
      [name]: { exerciseId: exercise.id, muscleGroupName: exercise.muscleGroup.name },
    }));
  };

  const startCustomDraft = (name: string) => {
    setCustomDrafts((prev) => ({
      ...prev,
      [name]: {
        name: stripEquipmentSuffix(name),
        muscleGroupId: muscleGroups[0]?.id ?? "",
      },
    }));
  };

  const saveCustomExercise = async (name: string) => {
    const draft = customDrafts[name];
    if (!draft || !draft.name.trim() || !draft.muscleGroupId) return;

    setSavingCustomFor(name);
    try {
      const res = await fetch(`${API_URL}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          muscleGroupId: draft.muscleGroupId,
          isCustom: true,
        }),
      });
      if (!res.ok) throw new Error(t("import.errorCreateExercise"));
      const created: ExerciseCandidate = await res.json();
      setExercises((prev) => [...prev, created]);
      resolveWith(name, created);
      setCustomDrafts((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    } catch (err) {
      console.error(err);
      setError(t("import.errorCreateExercise"));
    } finally {
      setSavingCustomFor(null);
    }
  };

  const buildImportPayload = () => {
    return workouts.map((w) => {
      const resolvedExercises = w.exercises.map((e) => {
        const resolution = resolutions[e.name]!;
        return {
          exerciseId: resolution.exerciseId,
          muscleGroupName: resolution.muscleGroupName,
          sets: e.sets.map((s) => ({
            weight: s.weight,
            reps: s.reps,
            unit: weightUnit,
          })),
        };
      });

      const counts: Record<string, number> = {};
      for (const e of resolvedExercises) {
        counts[e.muscleGroupName] = (counts[e.muscleGroupName] ?? 0) + 1;
      }
      const muscleGroup = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

      return {
        date: w.date,
        muscleGroup,
        exercises: resolvedExercises.map(({ exerciseId, sets }) => ({
          exerciseId,
          sets,
        })),
      };
    });
  };

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ workouts: buildImportPayload() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("import.errorImport"));
      setImportResult(data);
      setStep("done");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : t("import.errorImport"));
    } finally {
      setImporting(false);
    }
  };

  const handleUndo = async () => {
    if (!importResult) return;
    setUndoing(true);
    try {
      await fetch(`${API_URL}/import/${importResult.importBatchId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setUndone(true);
    } catch (err) {
      console.error(err);
      setError(t("import.errorUndo"));
    } finally {
      setUndoing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf6f1] pb-16">
      <div className="flex items-center gap-3 px-5 pt-8 pb-6" style={{ background: "#191714" }}>
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors flex-shrink-0"
        >
          <ChevronLeft size={16} className="text-white" />
        </button>
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-wide leading-tight">
            {t("import.title")}
          </h1>
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1">
            {t("import.subtitle")}
          </p>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-500 text-sm rounded-2xl px-4 py-3 flex items-start gap-2">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {step === "upload" && (
          <>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingFile(true);
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={handleDrop}
              className={`bg-[#ece7dd] border-2 border-dashed rounded-3xl p-6 flex flex-col items-center text-center shadow-sm transition-colors ${
                isDraggingFile ? "border-[#c9552c]" : "border-[#d6d0c1]"
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-white/60 flex items-center justify-center mb-3">
                <Download size={22} className="text-[#c9552c]" />
              </div>
              <p className="text-base font-black text-gray-900 uppercase mb-1">
                {t("import.chooseFile")}
              </p>
              <p className="text-sm text-gray-500 mb-5">
                {t("import.chooseFileDesc")}
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFile}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={parsing}
                className="w-full bg-[#c9552c] disabled:opacity-50 text-white py-3.5 rounded-full font-bold uppercase tracking-wide text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Download size={18} />
                {parsing ? t("import.readingInProgress") : t("import.chooseAFile")}
              </button>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-3">
                {t("import.orDropHere")}
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-3xl p-5">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
                {t("import.howToExport")}
              </p>
              <div className="space-y-3">
                {(t("import.exportSteps", { returnObjects: true }) as string[]).map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                      style={{ background: "#191714" }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between bg-[#ece7dd] rounded-2xl px-4 py-3 shadow-sm">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                {t("import.acceptedFormats")}
              </span>
              <span className="text-xs font-bold text-[#c9552c] uppercase">
                {t("import.acceptedFormatsValue")}
              </span>
            </div>
          </>
        )}

        {step === "preview" && dateRange && (
          <>
            <div className="bg-[#ece7dd] rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
                {t("import.previewTitle")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/60 rounded-xl p-3">
                  <p className="text-xl font-black text-gray-900">
                    {workouts.length}
                  </p>
                  <p className="text-[11px] text-gray-500 font-bold uppercase">
                    {t("import.sessions")}
                  </p>
                </div>
                <div className="bg-white/60 rounded-xl p-3">
                  <p className="text-xl font-black text-gray-900">
                    {uniqueNames.length}
                  </p>
                  <p className="text-[11px] text-gray-500 font-bold uppercase">
                    {t("import.uniqueExercises")}
                  </p>
                </div>
                <div className="bg-white/60 rounded-xl p-3 col-span-2">
                  <p className="text-sm font-bold text-gray-900">
                    {dateRange[0].toLocaleDateString(getDateLocale())} —{" "}
                    {dateRange[1].toLocaleDateString(getDateLocale())}
                  </p>
                  <p className="text-[11px] text-gray-500 font-bold uppercase">
                    {t("import.dateRange")}
                  </p>
                </div>
              </div>

              {unresolvedNames.length > 0 && (
                <div className="mt-3 flex items-center gap-2 bg-[#c9552c]/10 rounded-xl px-3 py-2.5">
                  <AlertTriangle size={15} className="text-[#c9552c] flex-shrink-0" />
                  <p className="text-xs text-[#c9552c] font-bold">
                    {t("import.exerciseToMatch", { count: unresolvedNames.length })}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-[#ece7dd] rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
                {t("import.fileWeightUnit")}
              </p>
              <div className="flex gap-2">
                {(["lb", "kg"] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setWeightUnit(u)}
                    className={`flex-1 py-2.5 rounded-full text-sm font-bold uppercase transition-colors ${
                      weightUnit === u
                        ? "bg-[#191714] text-white"
                        : "bg-white/60 text-gray-500"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() =>
                setStep(unresolvedNames.length > 0 ? "mapping" : "confirm")
              }
              className="w-full bg-[#191714] text-white py-3.5 rounded-full font-bold uppercase tracking-wide text-sm active:opacity-90 transition-opacity shadow-sm"
            >
              {t("import.continue")}
            </button>
          </>
        )}

        {step === "mapping" && (
          <>
            <p className="text-sm text-gray-500 px-1">
              {t("import.mappingDesc")}
            </p>
            {unresolvedNames.map((name) => (
              <ExerciseMappingCard
                key={name}
                csvName={name}
                suggestions={suggestionsByName[name] ?? []}
                allExercises={exercises}
                muscleGroups={muscleGroups}
                draft={customDrafts[name]}
                savingCustom={savingCustomFor === name}
                onPick={(exercise) => resolveWith(name, exercise)}
                onStartCustom={() => startCustomDraft(name)}
                onDraftChange={(draft) =>
                  setCustomDrafts((prev) => ({ ...prev, [name]: draft }))
                }
                onSaveCustom={() => saveCustomExercise(name)}
                onCancelCustom={() =>
                  setCustomDrafts((prev) => {
                    const next = { ...prev };
                    delete next[name];
                    return next;
                  })
                }
              />
            ))}

            {unresolvedNames.length === 0 && (
              <div className="bg-[#ece7dd] rounded-2xl p-5 shadow-sm text-center">
                <Check size={20} className="text-[#3a9e6e] mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-900">
                  {t("import.allMatched")}
                </p>
              </div>
            )}

            <button
              onClick={() => setStep("confirm")}
              disabled={unresolvedNames.length > 0}
              className="w-full bg-[#191714] disabled:opacity-40 text-white py-3.5 rounded-full font-bold uppercase tracking-wide text-sm active:opacity-90 transition-opacity shadow-sm"
            >
              {t("import.continue")}
            </button>
          </>
        )}

        {step === "confirm" && dateRange && (
          <>
            <div className="bg-[#ece7dd] rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
                {t("import.readyToImport")}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                {t("import.importSummary", {
                  sessions: t("import.session", { count: workouts.length }),
                  from: dateRange[0].toLocaleDateString(getDateLocale()),
                  to: dateRange[1].toLocaleDateString(getDateLocale()),
                  exercises: t("import.exercise", { count: uniqueNames.length }),
                })}
              </p>
              <p className="text-xs text-gray-500">
                {t("import.willBeAdded")}
              </p>
            </div>

            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full bg-[#c9552c] disabled:opacity-50 text-white py-3.5 rounded-full font-bold uppercase tracking-wide text-sm active:scale-[0.98] transition-transform shadow-sm"
            >
              {importing ? t("import.importInProgress") : t("import.importAction")}
            </button>
          </>
        )}

        {step === "done" && importResult && (
          <div className="bg-[#ece7dd] rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
            {undone ? (
              <>
                <div className="w-14 h-14 rounded-full bg-white/60 flex items-center justify-center mb-3">
                  <Check size={22} className="text-gray-500" />
                </div>
                <p className="text-base font-black text-gray-900 uppercase mb-1">
                  {t("import.importCancelled")}
                </p>
                <p className="text-sm text-gray-500 mb-5">
                  {t("import.importCancelledDesc")}
                </p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-[#3a9e6e]/10 flex items-center justify-center mb-3">
                  <Check size={22} className="text-[#3a9e6e]" />
                </div>
                <p className="text-base font-black text-gray-900 uppercase mb-1">
                  {t("import.importDone")}
                </p>
                <p className="text-sm text-gray-500 mb-5">
                  {t("import.importDoneSummary", {
                    sessions: t("import.session", { count: importResult.sessionsCreated }),
                    sets: t("import.set", { count: importResult.setsCreated }),
                  })}
                </p>
              </>
            )}

            <button
              onClick={() => navigate("/profil")}
              className="w-full bg-[#191714] text-white py-3.5 rounded-full font-bold uppercase tracking-wide text-sm active:opacity-90 transition-opacity mb-2"
            >
              {t("import.finish")}
            </button>
            {!undone && (
              <button
                onClick={handleUndo}
                disabled={undoing}
                className="w-full bg-white/60 disabled:opacity-50 text-red-500 py-3 rounded-full font-bold uppercase tracking-wide text-sm transition-colors"
              >
                {undoing ? t("import.undoing") : t("import.undoImport")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ExerciseMappingCard({
  csvName,
  suggestions,
  allExercises,
  muscleGroups,
  draft,
  savingCustom,
  onPick,
  onStartCustom,
  onDraftChange,
  onSaveCustom,
  onCancelCustom,
}: {
  csvName: string;
  suggestions: MatchSuggestion[];
  allExercises: ExerciseCandidate[];
  muscleGroups: MuscleGroup[];
  draft: { name: string; muscleGroupId: string } | undefined;
  savingCustom: boolean;
  onPick: (exercise: ExerciseCandidate) => void;
  onStartCustom: () => void;
  onDraftChange: (draft: { name: string; muscleGroupId: string }) => void;
  onSaveCustom: () => void;
  onCancelCustom: () => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const filtered = allExercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="bg-[#ece7dd] rounded-2xl p-4 shadow-sm">
      <p className="text-sm font-bold text-gray-900 mb-2">{csvName}</p>

      {!draft && (
        <>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {suggestions.slice(0, 3).map((s) => (
                <button
                  key={s.exercise.id}
                  onClick={() => onPick(s.exercise)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 active:bg-gray-200 transition-colors"
                >
                  {s.exercise.name} · {Math.round(s.confidence * 100)}%
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setShowSearch((v) => !v)}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl border border-gray-200 text-gray-700"
            >
              <Search size={13} /> {t("import.searchExercise")}
            </button>
            <button
              onClick={onStartCustom}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl border border-[#c9552c]/40 text-[#c9552c]"
            >
              <Plus size={13} /> {t("import.createCustom")}
            </button>
          </div>

          {showSearch && (
            <div className="mt-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("import.search")}
                autoFocus
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm mb-1.5 focus:outline-none focus:border-[#c9552c]"
              />
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filtered.slice(0, 20).map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      onPick(e);
                      setShowSearch(false);
                    }}
                    className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
                  >
                    {e.name}{" "}
                    <span className="text-gray-400">({e.muscleGroup.name})</span>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">
                    {t("import.noResults")}
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {draft && (
        <div className="space-y-2">
          <input
            type="text"
            value={draft.name}
            onChange={(e) => onDraftChange({ ...draft, name: e.target.value })}
            placeholder={t("import.exerciseName")}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9552c]"
          />
          <select
            value={draft.muscleGroupId}
            onChange={(e) =>
              onDraftChange({ ...draft, muscleGroupId: e.target.value })
            }
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#c9552c]"
          >
            {muscleGroups.map((mg) => (
              <option key={mg.id} value={mg.id}>
                {mg.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={onCancelCustom}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-semibold"
            >
              {t("import.cancel")}
            </button>
            <button
              onClick={onSaveCustom}
              disabled={!draft.name.trim() || savingCustom}
              className="flex-1 bg-[#c9552c] disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold"
            >
              {savingCustom ? t("import.creating") : t("import.create")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
