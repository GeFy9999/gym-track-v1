import { useEffect, useState } from "react";
import { API_URL } from "../../lib/api";

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
    <div className="pt-6">
      <h1 className="text-[32px] font-black text-gray-900 leading-tight">
        Stats
      </h1>
      <p className="text-lg text-gray-500 mt-1">{message}</p>
    </div>
  );
}
