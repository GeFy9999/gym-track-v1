type Props = {
  exerciseName: string | undefined;
  noteDraft: string;
  onDraftChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export default function NoteModal({
  exerciseName,
  noteDraft,
  onDraftChange,
  onClose,
  onSave,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
        <p className="text-base font-bold text-gray-900 text-center mb-1">
          Note personnelle
        </p>
        <p className="text-sm text-gray-400 text-center mb-4">
          {exerciseName}
        </p>

        <textarea
          value={noteDraft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="Ex : grip plus large, épaule sensible, viser 5×5..."
          rows={4}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#c9552c] resize-none mb-4"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onSave}
            className="flex-1 bg-[#c9552c] text-white py-3 rounded-xl font-semibold transition-colors"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}
