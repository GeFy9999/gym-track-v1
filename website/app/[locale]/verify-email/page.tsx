"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { useLocaleDict } from "@/lib/useLocaleDict";
import { API_URL } from "@/lib/api";
import { consumePendingPlan } from "@/lib/pendingPlan";
import { startCheckoutForPendingPlan } from "@/lib/checkout";

function VerifyEmailInner() {
  const { locale, dict } = useLocaleDict();
  const t = dict.auth.verifyEmail;
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // token is already known from the URL on first render, so the "no token"
  // case is the initial state itself rather than something an effect needs
  // to set — the effect below only ever runs for the "token present" path.
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    token ? "verifying" : "error",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(
    token ? null : t.invalidLink,
  );
  // The verification token is single-use — this must fire exactly once
  // (React dev-mode double-invoke would otherwise burn it on the first of
  // two near-simultaneous requests, failing the other with "link expired").
  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) return;
    requested.current = true;

    const verify = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || t.errorGeneric);

        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));
        setStatus("success");

        const checkout = await startCheckoutForPendingPlan(result.token);
        setTimeout(() => {
          if (checkout && "url" in checkout) {
            window.location.href = checkout.url;
          } else {
            consumePendingPlan();
            router.push(`/${locale}#tarifs`);
          }
        }, 1200);
      } catch (err) {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : t.errorGeneric);
      }
    };
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen bg-[#faf6f1] flex flex-col items-center justify-center px-6 text-center">
      {status === "verifying" && <p className="text-sm text-gray-500">{t.verifying}</p>}

      {status === "success" && (
        <>
          <div className="w-14 h-14 rounded-full bg-[#3a9e6e]/10 flex items-center justify-center mb-4">
            <CheckCircle2 size={24} className="text-[#3a9e6e]" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{t.success}</h1>
          <p className="text-sm text-gray-500">{t.redirecting}</p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <XCircle size={24} className="text-red-500" />
          </div>
          <p className="text-red-500 mb-4">{errorMessage}</p>
          <Link href={`/${locale}/login`} className="text-[#c9552c] font-semibold text-sm">
            {t.backToLogin}
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
