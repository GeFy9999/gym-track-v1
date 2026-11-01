import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, Trash2, X, ChevronUp, ChevronDown } from "lucide-react";
import BottomSheet from "../BottomSheet";
import {
  buildExerciseSearchIndex,
  searchExercises,
} from "../../utils/exerciseSearch";
import { getMuscleGroupLabel } from "../../utils/muscleGroupLabel";
import type { ExercisePreset, PresetExercise } from "../../hooks/useExercisePresets";

type GroupExercise = PresetExercise & { muscleGroup: { id: string; name: string } };

type Props = {
  muscleGroup: string;
  // null = creating a new preset.
  preset: ExercisePreset | null;
  defaultName: string;
  groupExercises: GroupExercise[];
  onSave: (name: string, exerciseIds: string[]) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
};

// Create or edit a preset: its name, and which of the group's exercises it
// holds, in order.
export default function PresetEditorSheet({
  muscleGroup,
  preset,
  defaultName,
  groupExercises,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState(preset?.name ?? defaultName);
  const [selected, setSelected] = useState<PresetExercise[]>(
    preset?.exercises ?? [],
  );
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState(false);

  const selectedIds = new Set(selected.map((e) => e.id));
  const searchIndex = useMemo(
    () => buildExerciseSearchIndex(groupExercises),
    [groupExercises],
  );
  const candidates = useMemo(
    () =>
      searchExercises(searchIndex, search).filter(
        (e) => !selectedIds.has(e.id),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchIndex, search, selected],
  );

  const move = (index: number, by: number) => {
    setSelected((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(index + by, 0, item);
      return next;
    });
  };

  const run = async (
    action: () => Promise<void>,
    close: (then?: () => void) => void,
  ) => {
    setSaving(true);
    setError(false);
    try {
      await action();
      close();
    } catch (err) {
      console.error(err);
      setError(true);
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      title={preset ? t("presets.editTitle") : t("presets.newTitle")}
      subtitle={getMuscleGroupLabel(muscleGroup, t)}
      onClose={onClose}
    >
      {(close) => (
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 px-1">
              {t("presets.name")}
            </label>
            <input
              type="text"
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#c9552c]"
            />
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 px-1">
              {t("presets.exercisesCount", { count: selected.length })}
            </p>
            {selected.length === 0 ? (
              <p className="text-xs text-gray-400 px-1 py-2">
                {t("presets.emptyHint")}
              </p>
            ) : (
              <div className="space-y-1">
                {selected.map((ex, i) => (
                  <div
                    key={ex.id}
                    className="flex items-center gap-1 bg-[#c9552c]/10 rounded-xl pl-4 pr-1.5 py-1.5"
                  >
                    <span className="flex-1 min-w-0 truncate text-sm font-semibold text-gray-900">
                      {ex.name}
                    </span>
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label={t("presets.moveUp")}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 disabled:opacity-25 active:bg-white/60"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === selected.length - 1}
                      aria-label={t("presets.moveDown")}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 disabled:opacity-25 active:bg-white/60"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      onClick={() =>
                        setSelected((prev) => prev.filter((e) => e.id !== ex.id))
                      }
                      aria-label={t("presets.remove")}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 active:text-red-500 active:bg-white/60"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-2xl p-2">
            <div className="relative mb-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("session.searchExercisePlaceholder")}
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#c9552c]"
              />
            </div>
            <div className="max-h-56 overflow-y-auto">
              {candidates.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => setSelected((prev) => [...prev, ex])}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-gray-700 active:bg-white"
                >
                  <Plus size={14} className="text-[#c9552c] flex-shrink-0" />
                  <span className="truncate">{ex.name}</span>
                </button>
              ))}
              {candidates.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-3">
                  {t("session.noResults")}
                </p>
              )}
            </div>
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-500 text-center">
              {t("presets.saveError")}
            </p>
          )}

          <div className="flex gap-2">
            {onDelete &&
              (confirmingDelete ? (
                <button
                  onClick={() => run(onDelete, close)}
                  disabled={saving}
                  className="flex-1 bg-red-500 text-white text-sm font-bold py-3 rounded-xl disabled:opacity-50"
                >
                  {t("presets.confirmDelete")}
                </button>
              ) : (
                <button
                  onClick={() => setConfirmingDelete(true)}
                  aria-label={t("presets.delete")}
                  className="w-12 bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center active:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              ))}
            {!confirmingDelete && (
              <button
                onClick={() =>
                  run(
                    () =>
                      onSave(
                        name.trim() || defaultName,
                        selected.map((e) => e.id),
                      ),
                    close,
                  )
                }
                disabled={saving}
                className="flex-1 bg-[#c9552c] text-white text-sm font-bold uppercase tracking-wide py-3 rounded-xl disabled:opacity-50"
              >
                {t("presets.save")}
              </button>
            )}
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
