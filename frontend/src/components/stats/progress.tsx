type ProgressPoint = {
  label: string;
  value: number; // 0 to 100, hauteur relative de la barre
};

const progressData: ProgressPoint[] = []; // vide pour l'instant = état "aucune donnée"

export default function ProgressChart() {
  const hasData = progressData.length > 0;

  // données mock juste pour visualiser les barres (à retirer une fois lié au backend)
  const mockBars = [30, 45, 40, 65, 50, 75];

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
      <div className="flex items-end justify-between h-32 gap-2">
        {mockBars.map((height, i) => (
          <div
            key={i}
            className="flex-1 bg-zinc-700 rounded-t-md"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      {!hasData && (
        <p className="text-center text-sm text-zinc-500 mt-3">
          Aucun exercice suivi encore
        </p>
      )}
    </div>
  );
}
