import { useEffect, useRef, useState } from "react";
import { formatAmount } from "../utils/units";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { ArrowLeft, Check, Crown, RefreshCw, TrendingDown } from "lucide-react";
import { API_URL } from "../lib/api";
import { getDateLocale } from "../i18n";
import { useIsPro } from "../hooks/useIsPro";
import { openExternalUrl } from "../lib/openExternal";
import { isValidPlan } from "../utils/pendingPlan";
import {
  ensureRevenueCatConfigured,
  isEntitledToPro,
  purchasePlan,
  PurchaseCancelledError,
  restorePurchases,
} from "../lib/revenueCat";

type Plan = "monthly" | "annual" | "lifetime";

const MONTHLY_PRICE = 4.99;
const ANNUAL_PRICE = 29.99;
const LIFETIME_PRICE = 79.99;
const ANNUAL_SAVINGS_PCT = Math.round(
  (1 - ANNUAL_PRICE / (MONTHLY_PRICE * 12)) * 100,
);

const PLAN_ORDER: Plan[] = ["monthly", "annual", "lifetime"];

const FEATURE_KEYS = [
  "loyaltyDiscount",
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
  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;
  const loyaltyDiscountCents: number = user?.loyaltyDiscountCents ?? 0;
  // The 7-day trial is once per account, across both plans — the server
  // enforces it; this only keeps the wording honest.
  const hasUsedTrial: boolean = user?.hasUsedTrial ?? false;

  // What the user is actually subscribed to right now, if anything — used
  // to mark that plan as current and block re-buying it.
  const currentPlan: Plan | null = !isPro
    ? null
    : user?.proCurrentPeriodEnd
      ? user?.proInterval === "year"
        ? "annual"
        : "monthly"
      : "lifetime";

  // A visitor who picked a plan on the marketing site arrives here with
  // "?plan=" still in the URL (carried through signup/verification via
  // pendingPlan) — honor it over the usual "annual" default, but never over
  // a plan the user is already actually subscribed to.
  const requestedPlan = searchParams.get("plan");
  const initialPlan =
    currentPlan ?? (isValidPlan(requestedPlan) ? requestedPlan : "annual");
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState(Boolean(sessionId));
  const [activationTimedOut, setActivationTimedOut] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showCancelWarning, setShowCancelWarning] = useState(false);
  const [showSwitchWarning, setShowSwitchWarning] = useState(false);
  const [switchSuccess, setSwitchSuccess] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  // Mirrors what `sessionId` does for the web Stripe redirect flow: marks
  // that a native purchase was just attempted, so the full-screen
  // activating/activated/timed-out states below know to render even though
  // there's no session_id in the URL for a direct SDK purchase.
  const [nativePurchaseFlow, setNativePurchaseFlow] = useState(false);
  const attemptsRef = useRef(0);

  const isCurrentSelection = isPro && plan === currentPlan;

  // Play Store policy requires Android purchases to go through Google Play
  // Billing (via RevenueCat) instead of Stripe — get the SDK ready as soon as
  // we know who's logged in, before the user has a chance to tap a plan.
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !user?.id) return;
    ensureRevenueCatConfigured(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const isGooglePlayBilled =
    Capacitor.isNativePlatform() && user?.billingProvider === "google_play";

  // Polls our own backend after a native purchase — RevenueCat's webhook
  // updates isPro asynchronously, same lag as the web Checkout redirect flow.
  const pollAfterNativePurchase = async () => {
    setActivating(true);
    setActivationTimedOut(false);
    for (let attempt = 1; attempt <= 5; attempt++) {
      await refreshProStatus();
      // refreshProStatus() writes to localStorage synchronously before its
      // setIsPro() re-render lands, so check there instead of the (stale,
      // closed-over) isPro value to stop polling as soon as it's confirmed.
      const stored = localStorage.getItem("user");
      if (stored && JSON.parse(stored).isPro) {
        setActivating(false);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    setActivating(false);
    setActivationTimedOut(true);
  };

  const handleRestore = async () => {
    setError(null);
    setRestoreMessage(null);
    setRestoring(true);
    try {
      const customerInfo = await restorePurchases();
      if (isEntitledToPro(customerInfo)) {
        setNativePurchaseFlow(true);
        await pollAfterNativePurchase();
      } else {
        setRestoreMessage(t("upgrade.restoreNone"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("upgrade.errorGeneric"));
    } finally {
      setRestoring(false);
    }
  };

  const handleManageSubscription = async () => {
    if (isGooglePlayBilled) {
      await openExternalUrl(
        `https://play.google.com/store/account/subscriptions?package=com.gymstrack.app`,
      );
      return;
    }
    setPortalLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/stripe/portal-session`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("upgrade.errorGeneric"));
      await openExternalUrl(data.url);
      setPortalLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("upgrade.errorGeneric"));
      setPortalLoading(false);
    }
  };

  const handleChangePlan = async () => {
    setError(null);
    setLoading(true);

    if (isGooglePlayBilled) {
      try {
        await purchasePlan(plan, {
          skipTrial: hasUsedTrial,
          replacingProductId: user?.proProductId ?? null,
        });
        setLoading(false);
        setNativePurchaseFlow(true);
        await pollAfterNativePurchase();
      } catch (err) {
        setLoading(false);
        if (err instanceof PurchaseCancelledError) return;
        setError(err instanceof Error ? err.message : t("upgrade.errorGeneric"));
      }
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/stripe/change-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("upgrade.errorGeneric"));
      if (data.url) {
        await openExternalUrl(data.url);
        setLoading(false);
        return;
      }
      // Switching between monthly/annual updates the existing subscription
      // in place — no redirect, just refresh the cached status.
      await refreshProStatus();
      setLoading(false);
      setSwitchSuccess(true);
      setTimeout(() => setSwitchSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("upgrade.errorGeneric"));
      setLoading(false);
    }
  };

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

    if (Capacitor.isNativePlatform()) {
      try {
        await purchasePlan(plan, { skipTrial: hasUsedTrial });
        setLoading(false);
        setNativePurchaseFlow(true);
        await pollAfterNativePurchase();
      } catch (err) {
        setLoading(false);
        if (err instanceof PurchaseCancelledError) return;
        setError(err instanceof Error ? err.message : t("upgrade.errorGeneric"));
      }
      return;
    }

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
      await openExternalUrl(data.url);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("upgrade.errorGeneric"));
      setLoading(false);
    }
  };

  // On native, Checkout/Portal open in the system browser with no deep link
  // back — so the app can't know a checkout finished via the ?session_id
  // polling below. Re-check Pro status whenever the app regains focus,
  // covering "user finished paying, then switched back to the app".
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = CapacitorApp.addListener("resume", () => {
      refreshProStatus();
    });
    return () => {
      listener.then((l) => l.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if ((sessionId || nativePurchaseFlow) && (activating || isPro || activationTimedOut)) {
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

        {switchSuccess && (
          <div className="bg-[#3a9e6e] text-white text-sm font-medium px-4 py-3 rounded-2xl text-center">
            {t("upgrade.switchSuccess")}
          </div>
        )}

        {restoreMessage && (
          <div className="bg-[#ece7dd] text-gray-700 text-sm font-medium px-4 py-3 rounded-2xl text-center">
            {restoreMessage}
          </div>
        )}

        {isPro && (
          <div className="bg-[#ece7dd] rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3a9e6e]/10 flex items-center justify-center flex-shrink-0">
              <Crown size={18} className="text-[#3a9e6e]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-gray-900 uppercase">
                {t("upgrade.currentPlan")}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {currentPlan && t(`upgrade.${currentPlan}`)}
                {user?.proCurrentPeriodEnd &&
                  ` · ${t("profile.proRenewsOn", {
                    date: new Date(user.proCurrentPeriodEnd).toLocaleDateString(
                      getDateLocale(),
                    ),
                  })}`}
              </p>
            </div>
            <span className="text-[10px] font-bold text-white bg-[#3a9e6e] px-2.5 py-1 rounded-full uppercase tracking-wide whitespace-nowrap flex-shrink-0">
              {t("upgrade.active")}
            </span>
          </div>
        )}

        <div className="bg-[#ece7dd] rounded-2xl p-2 pt-4 shadow-sm">
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
                {p === currentPlan ? (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wide text-white bg-[#3a9e6e] px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                    {t("upgrade.active")}
                  </span>
                ) : (
                  p === "annual" && (
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wide text-white bg-red-600 px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                      {t("upgrade.mostPopular")}
                    </span>
                  )
                )}
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
          {plan === "annual" && plan !== currentPlan && (
            <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wide bg-[#3a9e6e]/10 text-[#3a9e6e] px-2.5 py-1 rounded-full">
              {t("upgrade.save", { pct: ANNUAL_SAVINGS_PCT })}
            </span>
          )}
          <p className="text-xs text-gray-500 mt-3">
            {isCurrentSelection
              ? t("upgrade.currentPlanNote")
              : plan === "lifetime"
                ? t("upgrade.lifetimeNote")
                : isPro
                  ? t("upgrade.switchNote")
                  : hasUsedTrial
                    ? t("upgrade.noTrialNote")
                    : t("upgrade.trialNote")}
          </p>
        </div>

        {plan !== "lifetime" && (
          <div className="bg-[#3a9e6e] rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <TrendingDown size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white uppercase tracking-wide leading-tight">
                {t("upgrade.loyaltyHintTitle")}
              </p>
              <p className="text-xs text-white/80 mt-0.5">
                {t("upgrade.loyaltyHint")}
              </p>
            </div>
            <div className="bg-white rounded-2xl px-3.5 py-2 flex flex-col items-center flex-shrink-0">
              <span className="text-[9px] font-bold text-[#3a9e6e] uppercase tracking-widest whitespace-nowrap">
                {t("profile.upTo")}
              </span>
              <span className="text-lg font-black text-[#3a9e6e] leading-none whitespace-nowrap">
                -{formatAmount(plan === "annual" ? 3 : 1)}$
              </span>
            </div>
          </div>
        )}

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

        {isPro && !isCurrentSelection && loyaltyDiscountCents > 0 && (
          <div className="flex items-start gap-2.5 bg-[#c9552c]/10 rounded-2xl px-4 py-3">
            <TrendingDown size={16} className="text-[#c9552c] flex-shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-[#c9552c]">
              {t("upgrade.switchLoyaltyReminder", {
                amount: formatAmount(loyaltyDiscountCents / 100),
              })}
            </p>
          </div>
        )}

        <button
          onClick={
            isCurrentSelection
              ? undefined
              : isPro
                ? // Switching plan wipes the loyalty discount — confirm first
                  // when there's one to lose.
                  loyaltyDiscountCents > 0
                  ? () => setShowSwitchWarning(true)
                  : handleChangePlan
                : handleCheckout
          }
          disabled={loading || isCurrentSelection}
          className="w-full bg-[#c9552c] disabled:opacity-40 text-white py-3.5 rounded-full font-bold uppercase tracking-wide text-sm active:scale-[0.98] transition-transform shadow-sm"
        >
          {loading
            ? t("upgrade.redirecting")
            : isCurrentSelection
              ? t("upgrade.currentPlanCta")
              : isPro
                ? t("upgrade.switchPlan")
                : plan === "lifetime"
                  ? t("upgrade.buyLifetime")
                  : hasUsedTrial
                    ? t("upgrade.subscribe")
                    : t("upgrade.startTrial")}
        </button>

        {isPro && user?.proCurrentPeriodEnd && (
          <button
            onClick={() => setShowCancelWarning(true)}
            className="w-full text-center text-xs font-semibold text-red-500 py-2"
          >
            {t("upgrade.cancelSubscription")}
          </button>
        )}

        {!isPro && Capacitor.isNativePlatform() && (
          <button
            onClick={handleRestore}
            disabled={restoring}
            className="w-full text-center text-xs font-semibold text-gray-500 py-2 disabled:opacity-50"
          >
            {restoring ? t("upgrade.restoring") : t("upgrade.restorePurchases")}
          </button>
        )}

        {/* Auto-renewal terms next to the purchase button, as Google Play's
            subscription policy and consumer laws (e.g. Quebec, California)
            require: price, billing period, trial, how to cancel. */}
        <p className="text-[10px] leading-relaxed text-gray-400 text-center px-2">
          {plan === "lifetime"
            ? t("upgrade.legal.lifetime")
            : t("upgrade.legal.renewal", {
                price: `${formatAmount(plan === "monthly" ? MONTHLY_PRICE : ANNUAL_PRICE)}$${
                  plan === "monthly" ? t("upgrade.perMonth") : t("upgrade.perYear")
                }`,
                trial: !isPro && !hasUsedTrial ? t("upgrade.legal.trial") : "",
                where: Capacitor.isNativePlatform()
                  ? t("upgrade.legal.wherePlay")
                  : t("upgrade.legal.whereWeb"),
              })}{" "}
          {Capacitor.isNativePlatform()
            ? t("upgrade.legal.taxesPlay")
            : t("upgrade.legal.taxes")}
          <br />
          <Link to="/terms" className="underline">
            {t("upgrade.legal.terms")}
          </Link>
          {" · "}
          <Link to="/privacy" className="underline">
            {t("upgrade.legal.privacy")}
          </Link>
        </p>
      </div>

      {showSwitchWarning && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] px-6 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-[#c9552c]/10 flex items-center justify-center mx-auto mb-3">
              <TrendingDown size={22} className="text-[#c9552c]" />
            </div>
            <p className="text-base font-bold text-gray-900 text-center mb-2">
              {t("upgrade.switchWarning.title")}
            </p>
            <p className="text-sm text-gray-500 text-center mb-6">
              {t("upgrade.switchWarning.desc", {
                amount: formatAmount(loyaltyDiscountCents / 100),
              })}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowSwitchWarning(false)}
                className="w-full bg-[#c9552c] text-white py-3 rounded-xl font-semibold"
              >
                {t("upgrade.switchWarning.keep")}
              </button>
              <button
                onClick={() => {
                  setShowSwitchWarning(false);
                  handleChangePlan();
                }}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold"
              >
                {t("upgrade.switchWarning.continue")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelWarning && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] px-6 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-[#c9552c]/10 flex items-center justify-center mx-auto mb-3">
              <TrendingDown size={22} className="text-[#c9552c]" />
            </div>
            <p className="text-base font-bold text-gray-900 text-center mb-2">
              {t("profile.cancelWarning.title")}
            </p>
            <p className="text-sm text-gray-500 text-center mb-6">
              {loyaltyDiscountCents > 0
                ? t("profile.cancelWarning.descWithDiscount", {
                    amount: formatAmount(loyaltyDiscountCents / 100),
                  })
                : t("profile.cancelWarning.desc")}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowCancelWarning(false)}
                className="w-full bg-[#c9552c] text-white py-3 rounded-xl font-semibold"
              >
                {t("profile.cancelWarning.stay")}
              </button>
              <button
                onClick={() => {
                  setShowCancelWarning(false);
                  handleManageSubscription();
                }}
                disabled={portalLoading}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold disabled:opacity-50"
              >
                {t("profile.cancelWarning.continue")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
