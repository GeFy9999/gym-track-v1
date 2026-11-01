import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Pencil, Plus } from "lucide-react";
import BottomSheet from "../BottomSheet";
import { getMuscleGroupLabel } from "../../utils/muscleGroupLabel";
import type { ExercisePreset } from "../../hooks/useExercisePresets";

type Props = {
  muscleGroup: string;
  presets: ExercisePreset[];
  activePresetId: string | null;
  onSelect: (preset: ExercisePreset) => void;
  onCreate: () => void;
  onRename: (preset: ExercisePreset, name: string) => Promise<void>;
  onClose: () => void;
};

// The session's preset switcher: pick one of the group's presets (its
// exercises replace the ones not started yet), start a new one, or rename.
export default function PresetPickerSheet({
  muscleGroup,
  presets,
  activePresetId,
  onSelect,
  onCreate,
  onRename,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const submitRename = async (preset: ExercisePreset) => {
    const name = draft.trim();
    if (!name || name === preset.name) {
      setRenamingId(null);
      return;
    }
    setSaving(true);
    try {
      await onRename(preset, name);
      setRenamingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      title={t("presets.title")}
      subtitle={getMuscleGroupLabel(muscleGroup, t)}
      onClose={onClose}
    >
      {(close) => (
        <>
          {presets.length === 0 ? (
            <p className="text-sm text-gray-500 text-center px-4 pb-3">
              {t("presets.noneYet")}
            </p>
          ) : (
            <div className="space-y-1">
              {presets.map((preset) => {
                const active = preset.id === activePresetId;
                if (renamingId === preset.id) {
                  return (
                    <form
                      key={preset.id}
                      onSubmit={(e) => {
                        e.preventDefault();
                        submitRename(preset);
                      }}
                      className="flex gap-2 py-1"
                    >
                      <input
                        type="text"
                        value={draft}
                        maxLength={60}
                        autoFocus
                        onChange={(e) => setDraft(e.target.value)}
                        className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#c9552c]"
                      />
                      <button
                        type="submit"
                        disabled={saving || !draft.trim()}
                        className="bg-[#c9552c] disabled:opacity-50 text-white text-sm font-bold px-5 rounded-xl"
                      >
                        OK
                      </button>
                    </form>
                  );
                }
                return (
                  <div
                    key={preset.id}
                    className={`flex items-center rounded-xl transition-colors ${
                      active ? "bg-[#c9552c]/10" : "active:bg-gray-50"
                    }`}
                  >
                    <button
                      onClick={() =>
                        active ? close() : close(() => onSelect(preset))
                      }
                      className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold truncate ${
                            active ? "text-[#c9552c]" : "text-gray-800"
                          }`}
                        >
                          {preset.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {preset.exercises.length === 0
                            ? t("presets.exercisesCount", { count: 0 })
                            : preset.exercises.map((e) => e.name).join(" · ")}
                        </p>
                      </div>
                      {active && (
                        <Check size={16} className="text-[#c9552c] flex-shrink-0" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setDraft(preset.name);
                        setRenamingId(preset.id);
                      }}
                      aria-label={t("presets.rename")}
                      className="w-10 h-10 mr-1 rounded-lg flex items-center justify-center text-gray-400 active:bg-white/60 flex-shrink-0"
                    >
                      <Pencil size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={() => close(onCreate)}
            className="mt-3 w-full border border-dashed border-[#c9552c]/40 active:bg-[#c9552c]/5 text-[#c9552c] font-bold uppercase text-sm py-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus size={14} /> {t("presets.new")}
          </button>
          <p className="text-[11px] text-gray-400 text-center mt-3 px-4">
            {t("presets.switchHint")}
          </p>
        </>
      )}
    </BottomSheet>
  );
}
