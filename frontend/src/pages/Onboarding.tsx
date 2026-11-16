import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { ArrowLeft, Bell, FileSpreadsheet, Check, BarChart3 } from "lucide-react";
import WheelPicker from "../components/onboarding/WheelPicker";
import ReferralIcon from "../components/onboarding/ReferralIcon";
import { analyticsAvailable, getConsent, setConsent } from "../lib/analytics";
import {
  finishQuiz,
  REFERRAL_SOURCES,
  type ReferralSource,
} from "../lib/onboardingQuiz";

type StepId =
  | "otherApp"
  | "importInfo"
  | "unit"
  | "weight"
  | "restTimer"
  | "restDuration"
  | "notifications"
  | "referral"
  | "analytics";

const REST_PRESETS = [30, 45, 60, 90, 120, 150, 180, 240, 300];

const WEIGHT_RANGE = {
  kg: { min: 30, max: 250, default: 75 },
  lb: { min: 66, max: 550, default: 165 },
} as const;

const DECIMALS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function range(min: number, max: number) {
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

function canAskNotifications(): boolean {
  if (Capacitor.isNativePlatform()) return true;
  return typeof Notification !== "undefined" && Notification.permission === "default";
}

async function askNotificationPermission() {
  try {
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.requestPermissions();
    } else if (typeof Notification !== "undefined") {
      await Notification.requestPermission();
    }
  } catch {
    // Refused or unsupported: the timer still beeps and vibrates in the app.
  }
}

// Answers so far, kept for the tab's lifetime: opening the privacy policy
// from the last step and coming back mustn't start the questionnaire over.
const PROGRESS_KEY = "onboardingQuizProgress";

type Progress = {
  usedOtherApp: boolean | null;
  weightUnit: "kg" | "lb" | null;
  whole: number;
  decimal: number;
  weightSkipped: boolean;
  restTimerEnabled: boolean | null;
  restTimerSeconds: number;
  referralSource: ReferralSource | null;
  stepIndex: number;
};

const INITIAL_PROGRESS: Progress = {
  usedOtherApp: null,
  weightUnit: null,
  whole: WEIGHT_RANGE.kg.default,
  decimal: 0,
  weightSkipped: false,
  restTimerEnabled: null,
  restTimerSeconds: 120,
  referralSource: null,
  stepIndex: 0,
};

function loadProgress(): Progress {
  try {
    const raw = sessionStorage.getItem(PROGRESS_KEY);
    if (raw) return { ...INITIAL_PROGRESS, ...JSON.parse(raw) };
  } catch {
    // Unreadable: start over.
  }
  return INITIAL_PROGRESS;
}

// Only same-app paths, so "?next=" can't send anyone to another site.
function safeNext(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/login";
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();

  const [saved] = useState(loadProgress);
  const [usedOtherApp, setUsedOtherApp] = useState(saved.usedOtherApp);
  const [weightUnit, setWeightUnit] = useState(saved.weightUnit);
  const [whole, setWhole] = useState(saved.whole);
  const [decimal, setDecimal] = useState(saved.decimal);
  const [weightSkipped, setWeightSkipped] = useState(saved.weightSkipped);
  const [restTimerEnabled, setRestTimerEnabled] = useState(saved.restTimerEnabled);
  const [restTimerSeconds, setRestTimerSeconds] = useState(saved.restTimerSeconds);
  const [referralSource, setReferralSource] = useState(saved.referralSource);
  const [stepIndex, setStepIndex] = useState(saved.stepIndex);
  // Decided once: the browser's answer must not reshuffle the steps.
  const [notificationsAskable] = useState(canAskNotifications);
  // Asked here only if not already answered on this device (the choice is
  // per device, not per account).
  const [analyticsAskable] = useState(
    () => analyticsAvailable() && getConsent() === null,
  );

  useEffect(() => {
    const progress: Progress = {
      usedOtherApp,
      weightUnit,
      whole,
      decimal,
      weightSkipped,
      restTimerEnabled,
      restTimerSeconds,
      referralSource,
      stepIndex,
    };
    try {
      sessionStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {
      // Not critical.
    }
  }, [
    usedOtherApp,
    weightUnit,
    whole,
    decimal,
    weightSkipped,
    restTimerEnabled,
    restTimerSeconds,
    referralSource,
    stepIndex,
  ]);

  const steps = useMemo<StepId[]>(() => {
    const list: StepId[] = ["otherApp"];
    if (usedOtherApp) list.push("importInfo");
    list.push("unit", "weight", "restTimer");
    if (restTimerEnabled) {
      list.push("restDuration");
      if (notificationsAskable) list.push("notifications");
    }
    list.push("referral");
    if (analyticsAskable) list.push("analytics");
    return list;
  }, [usedOtherApp, restTimerEnabled, notificationsAskable, analyticsAskable]);

  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const unit = weightUnit ?? "kg";
  const progress = (stepIndex + 1) / steps.length;

  const next = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  const back = () => setStepIndex((i) => Math.max(i - 1, 0));

  const chooseUnit = (u: "kg" | "lb") => {
    if (u !== weightUnit) {
      setWhole(WEIGHT_RANGE[u].default);
      setDecimal(0);
    }
    setWeightUnit(u);
    next();
  };

  const finish = (source: ReferralSource | null = referralSource) => {
    finishQuiz({
      usedOtherApp: !!usedOtherApp,
      weightUnit: unit,
      bodyWeight: weightSkipped ? null : whole + decimal / 10,
      restTimerEnabled: !!restTimerEnabled,
      restTimerSeconds,
      referralSource: source,
    });
    try {
      sessionStorage.removeItem(PROGRESS_KEY);
    } catch {
      // Not critical.
    }
    navigate(safeNext(searchParams.get("next")), { replace: true });
  };

  // The referral question is the last one, unless the analytics one follows.
  const answerReferral = (source: ReferralSource | null) => {
    setReferralSource(source);
    if (analyticsAskable) next();
    else finish(source);
  };

  const answerAnalytics = (consent: "granted" | "denied") => {
    setConsent(consent);
    finish();
  };

  const formatRest = (seconds: number) => {
    if (seconds < 60) return `${seconds} s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s === 0 ? `${m} min` : `${m} min ${s}`;
  };

  // The language isn't known from an account yet: same toggle as the device
  // default, so someone can switch before answering.
  const otherLanguage = i18n.language?.startsWith("en") ? "fr" : "en";

  let content: ReactNode;
  switch (step) {
    case "otherApp":
      content = (
        <Question title={t("onboardingQuiz.otherApp.title")} subtitle={t("onboardingQuiz.otherApp.subtitle")}>
          <Choice
            selected={usedOtherApp === true}
            onClick={() => {
              setUsedOtherApp(true);
              setStepIndex(1);
            }}
          >
            {t("onboardingQuiz.otherApp.yes")}
          </Choice>
          <Choice
            selected={usedOtherApp === false}
            onClick={() => {
              setUsedOtherApp(false);
              setStepIndex(1);
            }}
          >
            {t("onboardingQuiz.otherApp.no")}
          </Choice>
        </Question>
      );
      break;

    case "importInfo":
      content = (
        <Question title={t("onboardingQuiz.importInfo.title")} subtitle={t("onboardingQuiz.importInfo.subtitle")}>
          <div className="flex flex-col items-center text-center bg-white rounded-3xl px-6 py-8">
            <div className="w-16 h-16 rounded-full bg-[#c9552c]/15 flex items-center justify-center mb-4">
              <FileSpreadsheet size={28} className="text-[#c9552c]" />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t("onboardingQuiz.importInfo.body")}
            </p>
          </div>
        </Question>
      );
      break;

    case "unit":
      content = (
        <Question title={t("onboardingQuiz.unit.title")} subtitle={t("onboardingQuiz.unit.subtitle")}>
          <Choice selected={weightUnit === "kg"} onClick={() => chooseUnit("kg")}>
            {t("onboardingQuiz.unit.kg")}
          </Choice>
          <Choice selected={weightUnit === "lb"} onClick={() => chooseUnit("lb")}>
            {t("onboardingQuiz.unit.lb")}
          </Choice>
        </Question>
      );
      break;

    case "weight": {
      const r = WEIGHT_RANGE[unit];
      content = (
        <Question title={t("onboardingQuiz.weight.title")} subtitle={t("onboardingQuiz.weight.subtitle")}>
          <div className="bg-[#ece7dd] rounded-2xl py-4 text-center mb-6">
            <span className="text-4xl font-black text-gray-900">
              {whole}
              {i18n.language?.startsWith("en") ? "." : ","}
              {decimal}
            </span>
            <span className="text-xl font-bold text-gray-500 ml-1.5">{unit}</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <WheelPicker
              values={range(r.min, r.max)}
              value={whole}
              onChange={setWhole}
              label={t("onboardingQuiz.weight.title")}
              className="w-24"
            />
            <span className="text-3xl font-black text-gray-900">
              {i18n.language?.startsWith("en") ? "." : ","}
            </span>
            <WheelPicker
              values={DECIMALS}
              value={decimal}
              onChange={setDecimal}
              label={t("onboardingQuiz.weight.decimal")}
              className="w-16"
            />
            <span className="text-xl font-bold text-gray-500">{unit}</span>
          </div>
        </Question>
      );
      break;
    }

    case "restTimer":
      content = (
        <Question title={t("onboardingQuiz.restTimer.title")} subtitle={t("onboardingQuiz.restTimer.subtitle")}>
          <Choice
            selected={restTimerEnabled === true}
            onClick={() => {
              setRestTimerEnabled(true);
              setStepIndex((i) => i + 1);
            }}
          >
            {t("onboardingQuiz.restTimer.yes")}
          </Choice>
          <Choice
            selected={restTimerEnabled === false}
            onClick={() => {
              setRestTimerEnabled(false);
              setStepIndex((i) => i + 1);
            }}
          >
            {t("onboardingQuiz.restTimer.no")}
          </Choice>
        </Question>
      );
      break;

    case "restDuration":
      content = (
        <Question title={t("onboardingQuiz.restDuration.title")} subtitle={t("onboardingQuiz.restDuration.subtitle")}>
          <div className="grid grid-cols-3 gap-3">
            {REST_PRESETS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRestTimerSeconds(s)}
                className={`py-4 rounded-2xl font-bold text-sm transition-colors active:scale-[0.97] ${
                  restTimerSeconds === s
                    ? "bg-[#c9552c] text-white"
                    : "bg-white text-gray-900"
                }`}
              >
                {formatRest(s)}
              </button>
            ))}
          </div>
        </Question>
      );
      break;

    case "notifications":
      content = (
        <Question title={t("onboardingQuiz.notifications.title")} subtitle={t("onboardingQuiz.notifications.subtitle")}>
          <div className="flex flex-col items-center text-center bg-white rounded-3xl px-6 py-8">
            <div className="w-16 h-16 rounded-full bg-[#c9552c]/15 flex items-center justify-center mb-4">
              <Bell size={28} className="text-[#c9552c]" />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t("onboardingQuiz.notifications.body")}
            </p>
          </div>
        </Question>
      );
      break;

    case "referral":
      content = (
        <Question title={t("onboardingQuiz.referral.title")} subtitle={t("onboardingQuiz.referral.subtitle")}>
          {REFERRAL_SOURCES.map((source) => (
            <Choice
              key={source}
              icon={<ReferralIcon source={source} />}
              selected={referralSource === source}
              onClick={() => answerReferral(source)}
            >
              {t(`onboardingQuiz.referral.sources.${source}`)}
            </Choice>
          ))}
        </Question>
      );
      break;

    case "analytics":
      content = (
        <Question title={t("consent.title")} subtitle={t("onboardingQuiz.analytics.subtitle")}>
          <div className="bg-white rounded-3xl px-6 py-6">
            <div className="w-14 h-14 rounded-full bg-[#c9552c]/15 flex items-center justify-center mx-auto mb-4">
              <BarChart3 size={26} className="text-[#c9552c]" />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{t("consent.body")}</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-900">
              {(["point1", "point2", "point3"] as const).map((point) => (
                <li key={point} className="flex gap-2.5">
                  <Check size={16} strokeWidth={3} className="text-[#3a9e6e] shrink-0 mt-0.5" />
                  {t(`consent.${point}`)}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-gray-500">
              {t("consent.change")}{" "}
              <Link to="/privacy" className="underline">
                {t("consent.policy")}
              </Link>
            </p>
          </div>
        </Question>
      );
      break;
  }

  // Bottom button: only on steps that aren't answered by tapping a choice.
  let footer: ReactNode = null;
  if (step === "importInfo" || step === "restDuration") {
    footer = <PrimaryButton onClick={next}>{t("onboardingQuiz.continue")}</PrimaryButton>;
  } else if (step === "weight") {
    footer = (
      <>
        <PrimaryButton
          onClick={() => {
            setWeightSkipped(false);
            next();
          }}
        >
          {t("onboardingQuiz.continue")}
        </PrimaryButton>
        <SecondaryButton
          onClick={() => {
            setWeightSkipped(true);
            next();
          }}
        >
          {t("onboardingQuiz.skip")}
        </SecondaryButton>
      </>
    );
  } else if (step === "notifications") {
    footer = (
      <>
        <PrimaryButton
          onClick={async () => {
            await askNotificationPermission();
            next();
          }}
        >
          {t("onboardingQuiz.notifications.enable")}
        </PrimaryButton>
        <SecondaryButton onClick={next}>{t("onboardingQuiz.notifications.later")}</SecondaryButton>
      </>
    );
  } else if (step === "referral") {
    footer = (
      <SecondaryButton onClick={() => answerReferral(null)}>
        {t("onboardingQuiz.skip")}
      </SecondaryButton>
    );
  } else if (step === "analytics") {
    // "No" exactly as easy as "Yes": same size, same row (CNIL, Loi 25).
    footer = (
      <div className="w-full max-w-sm flex gap-3">
        <button
          type="button"
          onClick={() => answerAnalytics("denied")}
          className="flex-1 bg-[#ece7dd] text-gray-900 py-4 rounded-full font-bold uppercase tracking-wide text-sm active:scale-[0.98] transition-transform"
        >
          {t("consent.decline")}
        </button>
        <button
          type="button"
          onClick={() => answerAnalytics("granted")}
          className="flex-1 bg-[#c9552c] text-white py-4 rounded-full font-bold uppercase tracking-wide text-sm active:scale-[0.98] transition-transform"
        >
          {t("consent.accept")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6f1] flex flex-col px-page-narrow pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-4 h-12">
        <button
          type="button"
          onClick={back}
          aria-label={t("onboardingQuiz.back")}
          className={`w-10 h-10 -ml-2 flex items-center justify-center rounded-full text-gray-900 active:bg-[#ece7dd] ${
            stepIndex === 0 ? "invisible" : ""
          }`}
        >
          <ArrowLeft size={22} />
        </button>
        <div
          className="flex-1 h-1.5 rounded-full bg-[#ece7dd] overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={stepIndex + 1}
        >
          <div
            className="h-full rounded-full bg-[#c9552c] transition-[width] duration-300 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <button
          type="button"
          onClick={() => i18n.changeLanguage(otherLanguage)}
          className="w-10 h-10 -mr-2 flex items-center justify-center rounded-full text-xs font-bold uppercase text-gray-500 active:bg-[#ece7dd]"
        >
          {otherLanguage}
        </button>
      </div>

      <div key={step} className="flex-1 flex flex-col pt-8 animate-fade-in">
        {content}
      </div>

      {footer && <div className="flex flex-col items-center gap-2 pt-6">{footer}</div>}
    </div>
  );
}

function Question({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <>
      <h1 className="text-3xl font-black text-gray-900 text-center leading-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-gray-500 text-center mt-3 max-w-xs mx-auto">
          {subtitle}
        </p>
      )}
      <div className="flex flex-col gap-3 mt-10 w-full max-w-sm mx-auto">
        {children}
      </div>
    </>
  );
}

function Choice({
  selected = false,
  icon,
  onClick,
  children,
}: {
  selected?: boolean;
  icon?: ReactNode;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-left font-bold text-gray-900 bg-white border-2 transition-colors active:scale-[0.98] ${
        selected ? "border-[#c9552c]" : "border-transparent"
      }`}
    >
      <span className="flex items-center gap-3.5">
        {icon && <span className="w-6 h-6 flex items-center justify-center shrink-0">{icon}</span>}
        {children}
      </span>
      {selected && <Check size={18} className="text-[#c9552c] shrink-0" strokeWidth={3} />}
    </button>
  );
}

function PrimaryButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full max-w-sm bg-[#c9552c] text-white py-4 rounded-full font-bold uppercase tracking-wide text-sm active:scale-[0.98] transition-transform"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full max-w-sm py-3 rounded-full font-bold uppercase tracking-wide text-xs text-gray-500"
    >
      {children}
    </button>
  );
}
