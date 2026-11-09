import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { analyticsAvailable, getConsent, onConsentChange, setConsent } from "../lib/analytics";

// Pages someone must be able to read before choosing.
const HIDDEN_ON = ["/privacy", "/terms", "/legal", "/account-deletion"];

// Asked once per device. "No" is exactly as easy as "Yes" (same size, same
// row) and nothing is sent before an answer — both required in France (CNIL)
// and Québec (Loi 25). The choice can be changed anytime in Profile.
export default function AnalyticsConsent() {
  const { t } = useTranslation();
  const location = useLocation();
  const [pending, setPending] = useState(() => analyticsAvailable() && getConsent() === null);

  useEffect(() => onConsentChange((c) => setPending(c === null)), []);

  if (!pending || HIDDEN_ON.includes(location.pathname)) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/30 animate-fade-in sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        className="w-full max-w-md overflow-hidden rounded-t-3xl bg-[#faf6f1] shadow-xl sm:rounded-3xl"
      >
        <div className="px-6 pt-8 pb-6" style={{ background: "#191714" }}>
          <h2
            id="consent-title"
            className="text-3xl font-black text-white uppercase tracking-wide leading-tight"
          >
            {t("consent.title")}
          </h2>
        </div>
        <div className="px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <p className="text-sm text-gray-600">{t("consent.body")}</p>
          <ul className="mt-3 space-y-1 text-sm text-gray-600">
            <li>✓ {t("consent.point1")}</li>
            <li>✓ {t("consent.point2")}</li>
            <li>✓ {t("consent.point3")}</li>
          </ul>
          <p className="mt-3 text-xs text-gray-500">
            {t("consent.change")}{" "}
            <Link to="/privacy" className="underline">
              {t("consent.policy")}
            </Link>
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => setConsent("denied")}
              className="flex-1 rounded-full bg-[#ece7dd] py-3 text-sm font-bold uppercase text-gray-900"
            >
              {t("consent.decline")}
            </button>
            <button
              onClick={() => setConsent("granted")}
              className="flex-1 rounded-full py-3 text-sm font-bold uppercase text-white"
              style={{ background: "#191714" }}
            >
              {t("consent.accept")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
