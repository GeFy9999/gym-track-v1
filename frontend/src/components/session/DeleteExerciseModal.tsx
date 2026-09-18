type Props = {
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteExerciseModal({ onCancel, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
        <p className="text-base font-semibold text-gray-900 text-center mb-2">
          Supprimer cet exercice ?
        </p>
        <p className="text-sm text-gray-400 text-center mb-6">
          Tous les sets associés seront aussi supprimés.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
