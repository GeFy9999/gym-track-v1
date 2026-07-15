type Record = {
  name: string;
  weight: number | null;
};

const personalRecords: Record[] = [
  { name: "Lat pulldown", weight: null },
  { name: "Squat", weight: null },
  { name: "Bench press", weight: null },
  { name: "Deadlift", weight: null },
];

export default function PersonalRecordCards() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {personalRecords.map(({ name, weight }) => (
        <div
          key={name}
          className="bg-zinc-800 border border-zinc-700 rounded-xl p-4"
        >
          <p className="text-xs text-zinc-400 mb-1">{name}</p>
          <p className="text-lg font-semibold text-zinc-300">
            {weight !== null ? `${weight} lb` : "—"}
          </p>
        </div>
      ))}
    </div>
  );
}
