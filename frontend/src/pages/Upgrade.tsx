import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Check, Crown, RefreshCw } from "lucide-react";
import { API_URL } from "../lib/api";
import { useIsPro } from "../hooks/useIsPro";

type Plan = "monthly" | "annual" | "lifetime";

const MONTHLY_PRICE = 4.99;
const ANNUAL_PRICE = 29.99;
const LIFETIME_PRICE = 79.99;
const ANNUAL_SAVINGS_PCT = Math.round(
  (1 - ANNUAL_PRICE / (MONTHLY_PRICE * 12)) * 100,
);

const PLAN_ORDER: Plan[] = ["monthly", "annual", "lifetime"];

const FEATURE_KEYS = [
  "unlimitedHistory",
  "calendarView",
  "csvExport",
  "advancedCharts",
  "supersetsWarmup",
  "barbellMode",
  "progressPhotos",
];

export default function UpgradePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { isPro, refreshProStatus } = useIsPro();

  const [plan, setPlan] = useState<Plan>("annual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState(Boolean(sessionId));
  const [activationTimedOut, setActivationTimedOut] = useState(false);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!sessionId || isPro) return;

    const poll = async () => {
      attemptsRef.current += 1;
      await refreshProStatus();
      if (attemptsRef.current >= 5) {
        setActivating(false);
        setActivationTimedOut(true);
      }
    };

    const interval = setInterval(poll, 1500);
    poll();
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    if (isPro && activating) {
      setActivating(false);
      setActivationTimedOut(false);
    }
  }, [isPro, activating]);

  const handleCheckout = async () => {
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/stripe/checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("upgrade.errorGeneric"));
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("upgrade.errorGeneric"));
      setLoading(false);
    }
  };

  if (sessionId && (activating || isPro || activationTimedOut)) {
    return (
      <div className="min-h-screen bg-[#faf6f1] flex flex-col items-center justify-center px-6 text-center">
        {isPro ? (
          <>
            <div className="w-16 h-16 rounded-full bg-[#3a9e6e]/10 flex items-center justify-center mb-4">
              <Check size={28} className="text-[#3a9e6e]" />
            </div>
            <h1 className="text-xl font-black text-gray-900 mb-2">
              {t("upgrade.activated")}
            </h1>
            <p className="text-sm text-gray-500 mb-8">
              {t("upgrade.activatedDesc")}
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-[#c9552c] text-white px-8 py-3 rounded-2xl font-semibold shadow-md"
            >
              {t("upgrade.goToDashboard")}
            </button>
          </>
        ) : activationTimedOut ? (
          <>
            <div className="w-16 h-16 rounded-full bg-[#c9552c]/10 flex items-center justify-center mb-4">
              <RefreshCw size={28} className="text-[#c9552c]" />
            </div>
            <h1 className="text-xl font-black text-gray-900 mb-2">
              {t("upgrade.checkBackShortly")}
            </h1>
            <p className="text-sm text-gray-500 mb-8">
              {t("upgrade.checkBackShortlyDesc")}
            </p>
            <button
              onClick={() => {
                setActivating(true);
                setActivationTimedOut(false);
                attemptsRef.current = 0;
                refreshProStatus();
              }}
              className="bg-[#c9552c] text-white px-8 py-3 rounded-2xl font-semibold shadow-md"
            >
              {t("upgrade.refresh")}
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-[#c9552c]/10 flex items-center justify-center mb-4 animate-pulse">
              <Crown size={28} className="text-[#c9552c]" />
            </div>
            <h1 className="text-xl font-black text-gray-900 mb-2">
              {t("upgrade.activating")}
            </h1>
            <p className="text-sm text-gray-500">
              {t("upgrade.activatingDesc")}
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6f1] pb-16">
      <div className="flex items-center gap-3 px-5 pt-8 pb-6" style={{ background: "#191714" }}>
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={16} className="text-white" />
        </button>
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-wide leading-tight">
            {t("upgrade.title")}
          </h1>
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1">
            {t("upgrade.subtitle")}
          </p>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-500 text-sm rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="bg-[#ece7dd] rounded-2xl p-2 shadow-sm">
          <div className="relative flex bg-gray-300/50 rounded-xl p-1">
            <div
              className="absolute top-1 bottom-1 left-1 w-[calc(33.333%-4px)] rounded-lg bg-[#191714] transition-transform duration-200 ease-out"
              style={{
                transform: `translateX(${PLAN_ORDER.indexOf(plan) * 100}%)`,
              }}
            />
            {PLAN_ORDER.map((p) => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={`relative z-10 flex-1 py-2.5 rounded-lg text-xs font-bold uppercase transition-colors ${
                  plan === p ? "text-white" : "text-gray-500"
                }`}
              >
                {t(`upgrade.${p}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#ece7dd] rounded-2xl p-6 shadow-sm text-center">
          <p className="text-4xl font-black text-gray-900">
            $
            {plan === "monthly"
              ? MONTHLY_PRICE
              : plan === "annual"
                ? ANNUAL_PRICE
                : LIFETIME_PRICE}
            {plan !== "lifetime" && (
              <span className="text-base font-bold text-gray-500">
                {plan === "monthly" ? t("upgrade.perMonth") : t("upgrade.perYear")}
              </span>
            )}
          </p>
          {plan === "annual" && (
            <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wide bg-[#3a9e6e]/10 text-[#3a9e6e] px-2.5 py-1 rounded-full">
              {t("upgrade.save", { pct: ANNUAL_SAVINGS_PCT })}
            </span>
          )}
          <p className="text-xs text-gray-500 mt-3">
            {plan === "lifetime" ? t("upgrade.lifetimeNote") : t("upgrade.trialNote")}
          </p>
        </div>

        <div className="bg-[#ece7dd] rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
            {t("upgrade.featureListTitle")}
          </p>
          <div className="space-y-2.5">
            {FEATURE_KEYS.map((key) => (
              <div key={key} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#3a9e6e]/10 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-[#3a9e6e]" />
                </div>
                <p className="text-sm text-gray-700">
                  {t(`upgrade.featureList.${key}`)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-[#c9552c] disabled:opacity-50 text-white py-3.5 rounded-full font-bold uppercase tracking-wide text-sm active:scale-[0.98] transition-transform shadow-sm"
        >
          {loading
            ? t("upgrade.redirecting")
            : plan === "lifetime"
              ? t("upgrade.buyLifetime")
              : t("upgrade.startTrial")}
        </button>
      </div>
    </div>
  );
}
