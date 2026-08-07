import { useEffect, useState } from "react";

const API_URL = "/api";

export default function HeaderStats() {
  const [hasCompletedWeek, setHasCompletedWeek] = useState<boolean>(false);

  useEffect(() => {
    const checkHistory = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_URL}/sessions/me/streak`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setHasCompletedWeek(data.streak > 0);
      }
    };
    checkHistory();
  }, []);

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
