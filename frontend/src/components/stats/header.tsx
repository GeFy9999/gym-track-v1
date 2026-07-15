import { useState } from "react";

export default function HeaderStats() {
  const [hasCompletedWeek, setHasCompletedWeek] = useState<boolean>(false);

  const message = hasCompletedWeek
    ? "Tes statistiques de progression"
    : "Termine ta première semaine pour débloquer tes statistiques";

  return (
    <div className="pt-5">
      <p className="text-2xl font-bold text-white mb-1">Stats</p>
      <p className="text-sm text-zinc-400">{message}</p>
    </div>
  );
}
