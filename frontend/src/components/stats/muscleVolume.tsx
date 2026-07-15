type MuscleGroupVolume = {
  name: string;
  volume: number; // 0 to 100, pourcentage relatif pour la largeur de la barre
};

const muscleVolumes: MuscleGroupVolume[] = [
  { name: "Dos", volume: 0 },
  { name: "Pec", volume: 0 },
  { name: "Jambes", volume: 0 },
];

export default function MuscleVolume() {
  return (
    <div className="space-y-3">
      {muscleVolumes.map(({ name, volume }) => (
        <div key={name} className="flex items-center gap-3">
          <span className="text-sm text-zinc-400 w-16 shrink-0">{name}</span>
          <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-600 rounded-full"
              style={{ width: `${volume}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
