import HeaderDashboard from "../components/dashboard/header";
import WeekProgress from "../components/dashboard/weekProgressCard";
import MuscleGroupsCards from "../components/dashboard/muscleGroupGrid";
import RecentActivity from "../components/dashboard/recentActivity";
import { useState, useEffect, useRef } from "react";
import { CheckCircle, Scale, ChevronRight } from "lucide-react";
import { API_URL } from "../lib/api";
import TourOverlay from "../components/TourOverlay";

export default function DashboardPage() {
  const [weekActive, setWeekActive] = useState<boolean>(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWeightPrompt, setShowWeightPrompt] = useState(false);
  const [bodyWeight, setBodyWeight] = useState("");

  // Onboarding
  const [showWelcome, setShowWelcome] = useState(false);
  const [showOnboardingWeight, setShowOnboardingWeight] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const stored = localStorage.getItem("user");
  const userName = stored ? JSON.parse(stored).name : "";

  // Always check weekActive on mount/return
  useEffect(() => {
    const checkWeek = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diff);
      monday.setHours(0, 0, 0, 0);

      try {
        const res = await fetch(
          `${API_URL}/sessions/me?start=${monday.toISOString()}&end=${now.toISOString()}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) return;
        const sessions = await res.json();
        if (sessions.length > 0) setWeekActive(true);
      } catch (err) {
        console.error(err);
      }
    };
    checkWeek();
  }, []);

  // Onboarding + body weight check
  useEffect(() => {
    const onboardingDone = localStorage.getItem("onboardingDone");
    if (!onboardingDone) {
      setShowWelcome(true);
      return;
    }

    const checkBodyWeight = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const snoozed = localStorage.getItem("weightSnooze");
      if (snoozed) {
        const snoozeDate = new Date(snoozed);
        const now = new Date();
        if (
          snoozeDate.getDate() === now.getDate() &&
          snoozeDate.getMonth() === now.getMonth() &&
          snoozeDate.getFullYear() === now.getFullYear()
        ) {
          return;
        }
      }

      const res = await fetch(`${API_URL}/body-weight`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;
      const entries = await res.json();

      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const thisMonday = new Date(now);
      thisMonday.setDate(now.getDate() - diff);
      thisMonday.setHours(0, 0, 0, 0);

      const hasEntryThisWeek = entries.some((e: { date: string }) => {
        const d = new Date(e.date);
        return d >= thisMonday;
      });

      if (!hasEntryThisWeek) {
        setShowWeightPrompt(true);
      }
    };
    checkBodyWeight();
  }, []);

  const handleWelcomeNext = () => {
    setShowWelcome(false);
    setShowOnboardingWeight(true);
  };

  const handleOnboardingWeightSave = async () => {
    const token = localStorage.getItem("token");
    if (!token || !bodyWeight) return;

    try {
      await fetch(`${API_URL}/body-weight`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: Number(bodyWeight) }),
      });
    } catch (err) {
      console.error(err);
    }

    setShowOnboardingWeight(false);
    setBodyWeight("");
    setShowTour(true);
  };

  const handleOnboardingWeightSkip = () => {
    setShowOnboardingWeight(false);
    setShowTour(true);
  };

  // Tour refs
  const tourRef0 = useRef<HTMLDivElement>(null);
  const tourRef1 = useRef<HTMLDivElement>(null);
  const tourRef2 = useRef<HTMLDivElement>(null);

  const dashboardTourSteps = [
    {
      title: "Commencer ta semaine",
      description:
        "Appuie ici pour démarrer ta semaine d'entraînement. Une fois active, tu pourras ajouter des sessions.",
      refIndex: 0,
    },
    {
      title: "Groupes musculaires",
      description:
        "Clique sur un groupe musculaire pour créer une session et ajouter des exercices. Un badge orange apparaîtra quand une session est en cours.",
      refIndex: 1,
    },
    {
      title: "Activité récente",
      description:
        "Ici tu retrouves tes dernières sessions avec les exercices et sets que tu as faits.",
      refIndex: 2,
    },
    {
      title: "Accueil",
      description:
        "C'est ici, ton tableau de bord principal. Tu y verras ta semaine, tes groupes musculaires et ton activité récente.",
      selector: "[data-tour='nav-accueil']",
      tooltipPosition: "above" as const,
    },
    {
      title: "Statistiques",
      description:
        "Consulte tes records personnels, ta progression et le volume de travail par groupe musculaire.",
      selector: "[data-tour='nav-stats']",
      tooltipPosition: "above" as const,
    },
    {
      title: "Records personnels",
      description:
        "Appuie sur le trophée pour choisir quels exercices suivre en record personnel. Une fois l'exercice fait au moins une fois, ton meilleur poids apparaîtra dans Stats.",
      selector: "[data-tour='nav-records']",
      tooltipPosition: "above" as const,
    },
    {
      title: "Historique",
      description:
        "Retrouve toutes tes séances passées organisées par semaine. Clique sur une séance pour revoir les détails.",
      selector: "[data-tour='nav-historique']",
      tooltipPosition: "above" as const,
    },
    {
      title: "Profil",
      description:
        "Gère ton compte, change ton mot de passe, suis ton poids corporel et consulte tes photos de progression.",
      selector: "[data-tour='nav-profil']",
      tooltipPosition: "above" as const,
    },
  ];

  const handleEndSession = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const res = await fetch(
        `${API_URL}/sessions/me?start=${todayStart.toISOString()}&end=${new Date().toISOString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.ok) {
        const sessions = await res.json();

        for (const session of sessions) {
          if (session.completed) continue;

          const hasSets = session.sessionExercises.some(
            (se: { sets: { weight: number; reps: number }[] }) =>
              se.sets.length > 0,
          );

          if (hasSets) {
            await fetch(`${API_URL}/sessions/${session.id}/complete`, {
              method: "PATCH",
            });
          } else {
            await fetch(`${API_URL}/sessions/${session.id}`, {
              method: "DELETE",
            });
          }
        }
      }

      setShowEndConfirm(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveWeight = async () => {
    const token = localStorage.getItem("token");
    if (!token || !bodyWeight) return;

    try {
      await fetch(`${API_URL}/body-weight`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: Number(bodyWeight) }),
      });

      setShowWeightPrompt(false);
      setBodyWeight("");
      localStorage.removeItem("weightSnooze");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSnoozeWeight = () => {
    localStorage.setItem("weightSnooze", new Date().toISOString());
    setShowWeightPrompt(false);
  };

  return (
    <div className="pb-28 bg-[#faf6f1] min-h-screen">
      <HeaderDashboard />
      <div ref={tourRef0}>
        <WeekProgress weekActive={weekActive} setWeekActive={setWeekActive} />
      </div>
      <div ref={tourRef1}>
        <MuscleGroupsCards weekActive={weekActive} />
      </div>
      <div ref={tourRef2}>
        <RecentActivity />
      </div>

      {weekActive && (
        <div className="px-5 mt-6">
          <button
            onClick={() => setShowEndConfirm(true)}
            className="w-full bg-[#3a9e6e] active:scale-[0.98] text-white py-4 rounded-2xl font-semibold transition-all shadow-md flex items-center justify-center"
          >
            Terminer la séance
          </button>
        </div>
      )}

      {showSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-[#3a9e6e] text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 z-50">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">
            Séance terminée ! Tes exercices sont sauvegardés.
          </span>
        </div>
      )}

      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <p className="text-base font-semibold text-gray-900 text-center mb-2">
              Terminer la séance ?
            </p>
            <p className="text-sm text-gray-400 text-center mb-6">
              Les sessions d'aujourd'hui seront marquées comme terminées. Tu
              pourras en créer de nouvelles demain.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleEndSession}
                className="flex-1 bg-[#3a9e6e] text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}

      {showWeightPrompt && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex flex-col items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mb-3">
                <Scale size={24} className="text-orange-500" />
              </div>
              <p className="text-base font-semibold text-gray-900 text-center">
                Quel est ton poids ?
              </p>
              <p className="text-xs text-gray-400 text-center mt-1">
                Entre ton poids pour suivre ta progression
              </p>
            </div>

            <div className="relative mb-4">
              <input
                type="number"
                value={bodyWeight}
                onChange={(e) => setBodyWeight(e.target.value)}
                placeholder="0"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-xl font-semibold text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-500 transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                {(() => {
                  const stored = localStorage.getItem("user");
                  if (!stored) return "lb";
                  return JSON.parse(stored).weightUnit || "lb";
                })()}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSnoozeWeight}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
              >
                Plus tard
              </button>
              <button
                onClick={handleSaveWeight}
                disabled={!bodyWeight}
                className="flex-1 bg-[#c9552c] disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome overlay */}
      {showWelcome && (
        <div className="fixed inset-0 bg-[#faf6f1] z-50 flex flex-col items-center justify-center px-8">
          <img
            src="/LogoGymsTrack5.webp"
            alt="GymsTrack"
            className="h-20 mb-6"
          />
          <h1 className="text-2xl font-black text-gray-900 text-center mb-2">
            Bienvenue{userName ? `, ${userName}` : ""} !
          </h1>
          <p className="text-sm text-gray-500 text-center mb-8 max-w-xs">
            Ton espace pour suivre tes entraînements, ta progression et
            atteindre tes objectifs.
          </p>
          <button
            onClick={handleWelcomeNext}
            className="w-full max-w-xs bg-[#c9552c] text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            Commencer
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Onboarding weight prompt */}
      {showOnboardingWeight && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex flex-col items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mb-3">
                <Scale size={24} className="text-orange-500" />
              </div>
              <p className="text-base font-semibold text-gray-900 text-center">
                Quel est ton poids actuel ?
              </p>
              <p className="text-xs text-gray-400 text-center mt-1">
                On va utiliser ça pour suivre ton évolution
              </p>
            </div>

            <div className="relative mb-4">
              <input
                type="number"
                value={bodyWeight}
                onChange={(e) => setBodyWeight(e.target.value)}
                placeholder="0"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-xl font-semibold text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-500 transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                {(() => {
                  const stored = localStorage.getItem("user");
                  if (!stored) return "lb";
                  return JSON.parse(stored).weightUnit || "lb";
                })()}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleOnboardingWeightSkip}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
              >
                Passer
              </button>
              <button
                onClick={handleOnboardingWeightSave}
                disabled={!bodyWeight}
                className="flex-1 bg-[#c9552c] disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tour guidé */}
      {showTour && (
        <TourOverlay
          tourKey="dashboard"
          steps={dashboardTourSteps}
          refs={[tourRef0, tourRef1, tourRef2]}
        />
      )}
    </div>
  );
}
