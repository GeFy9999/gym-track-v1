import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_URL } from "../../lib/api";

export default function HeaderStats() {
  const { t } = useTranslation();
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
    ? t("stats.subtitleReady")
    : t("stats.subtitleLocked");

  return (
    <div
      className="-mx-5 px-6 pt-6 pb-6"
      style={{ background: "var(--color-ink)" }}
    >
      <h1 className="text-[32px] font-black text-white uppercase tracking-wide leading-tight">
        {t("stats.title")}
      </h1>
      <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1">
        {message}
      </p>
    </div>
  );
}
