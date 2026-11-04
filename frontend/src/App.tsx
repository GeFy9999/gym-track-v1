import { Alert } from "./components/Alert";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, useEffect, useState } from "react";
import "./index.css";
import BottomNav from "./components/bottomNav/index.tsx";
import { API_URL } from "./lib/api";
import { RestTimerProvider, useRestTimerContext } from "./contexts/RestTimerContext";
import { UiChromeProvider, useUiChrome } from "./contexts/UiChromeContext";
import RestTimer from "./components/session/RestTimer";
import OfflineBanner from "./components/OfflineBanner";
import NetworkIndicator from "./components/NetworkIndicator";
import UpdateGate from "./components/UpdateGate";
import { FullPageSpinner } from "./components/Spinner";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { syncLoyaltyReminders } from "./lib/loyaltyReminders";
import { lazyPage } from "./lib/lazyPage";
// The entry screens for a signed-out visitor stay in the main bundle: as
// their own chunk, they'd only be requested once the main JS had run — an
// extra round trip before anything shows.
import LoginPage from "./pages/Login.tsx";
import RegisterPage from "./pages/Register.tsx";

// Every page is its own chunk: the first screen (login, dashboard…) only
// downloads its own code. The rest is prefetched once the app is idle —
// which also lets the service worker cache it, so pages never opened yet
// still work offline.
const DashboardPage = lazyPage(() => import("./pages/Dashboard"));
const StatsPage = lazyPage(() => import("./pages/Stats.tsx"));
const SessionPage = lazyPage(() => import("./pages/Session.tsx"));
const HistoryPage = lazyPage(() => import("./pages/History.tsx"));
const ProfilePage = lazyPage(() => import("./pages/Profile.tsx"));
const ForgotPasswordPage = lazyPage(() => import("./pages/ForgotPassword.tsx"));
const ResetPasswordPage = lazyPage(() => import("./pages/ResetPassword.tsx"));
const VerifyEmailPendingPage = lazyPage(() => import("./pages/VerifyEmailPending.tsx"));
const VerifyEmailPage = lazyPage(() => import("./pages/VerifyEmail.tsx"));
const ProgressPhotosPage = lazyPage(() => import("./pages/ProgressPhotos.tsx"));
const ImportPage = lazyPage(() => import("./pages/Import.tsx"));
const ExercisesPage = lazyPage(() => import("./pages/Exercises.tsx"));
const ExerciseDetailPage = lazyPage(() => import("./pages/ExerciseDetail.tsx"));
const UpgradePage = lazyPage(() => import("./pages/Upgrade.tsx"));
const PrivacyPolicyPage = lazyPage(() => import("./pages/PrivacyPolicy.tsx"));
const TermsOfServicePage = lazyPage(() => import("./pages/TermsOfService.tsx"));
const AccountDeletionPage = lazyPage(() => import("./pages/AccountDeletion.tsx"));
const LegalNoticePage = lazyPage(() => import("./pages/LegalNotice.tsx"));

const ALL_PAGES = [
  DashboardPage,
  StatsPage,
  SessionPage,
  HistoryPage,
  ProfilePage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPendingPage,
  VerifyEmailPage,
  ProgressPhotosPage,
  ImportPage,
  ExercisesPage,
  ExerciseDetailPage,
  UpgradePage,
  PrivacyPolicyPage,
  TermsOfServicePage,
  AccountDeletionPage,
  LegalNoticePage,
];

// Must match the longest of the sheet/bar exit animations in index.css
// (both 0.3s), plus a small buffer so the unmount never cuts it off early.
const REST_TIMER_EXIT_MS = 320;

function GlobalRestTimer() {
  const { isActive, secondsLeft, totalSeconds, skip, adjustSeconds } =
    useRestTimerContext();
  const [visible, setVisible] = useState(isActive);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (isActive) {
      setVisible(true);
      setExiting(false);
      return;
    }
    if (!visible) return;
    // Keep the component mounted long enough to play its exit animation
    // (slide down / fade out) instead of vanishing instantly when the
    // timer ends or gets skipped.
    setExiting(true);
    const timeout = window.setTimeout(() => {
      setVisible(false);
      setExiting(false);
    }, REST_TIMER_EXIT_MS);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  if (!visible) return null;
  return (
    <RestTimer
      secondsLeft={secondsLeft}
      totalSeconds={totalSeconds}
      onSkip={skip}
      onAdjust={adjustSeconds}
      exiting={exiting}
    />
  );
}

// The session check, made once per token rather than by every protected
// page: each page mounts its own ProtectedRoute, so checking there put a
// full-page spinner (and a server round trip) in front of every navigation.
let sessionCheck: { token: string; result: Promise<"ok" | "expired"> } | null =
  null;

function checkSessionOnce(token: string): Promise<"ok" | "expired"> {
  if (sessionCheck?.token === token) return sessionCheck.result;

  // A bad gym signal can leave this hanging: past a few seconds, treat it
  // like being offline.
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 6000);

  const result = fetch(`${API_URL}/sessions/me/streak`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: controller.signal,
  })
    .then((res): "ok" | "expired" => {
      if (res.status === 401 || res.status === 403) {
        // The session really is over (expired / revoked token).
        syncLoyaltyReminders(null);
        localStorage.clear();
        return "expired";
      }
      if (res.ok) {
        // Fresh user data on every launch — also (re)schedules the
        // loyalty reminders for people who never open their Profile.
        fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((meRes) => (meRes.ok ? meRes.json() : null))
          .then((data) => {
            if (!data?.user) return;
            localStorage.setItem("user", JSON.stringify(data.user));
            syncLoyaltyReminders(data.user);
          })
          .catch(() => {});
      }
      // Server error: not the user's fault — keep them signed in.
      return "ok";
    })
    // No connection (or it timed out): stay signed in and let the app work
    // offline from what it has cached. Logging out here used to wipe the
    // session on every launch without signal — and strand any workout
    // logged offline, since syncing needs the token.
    .catch((): "ok" => "ok")
    .finally(() => window.clearTimeout(timeout));

  sessionCheck = { token, result };
  return result;
}

function needsEmailVerification(): boolean {
  try {
    const stored = localStorage.getItem("user");
    return !!stored && JSON.parse(stored).emailVerified === false;
  } catch {
    return false;
  }
}

// Signed in = a token is stored: the page shows right away, while the
// session is checked in the background and the user sent to the login
// screen only if the server says it's over.
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  const [expired, setExpired] = useState(false);
  const { skip: stopRestTimer } = useRestTimerContext();

  useEffect(() => {
    if (!token) return;
    let active = true;
    checkSessionOnce(token).then((status) => {
      if (status !== "expired") return;
      stopRestTimer();
      if (active) setExpired(true);
    });
    return () => {
      active = false;
    };
  }, [token, stopRestTimer]);

  if (!token || expired) return <Navigate to="/login" replace />;
  if (needsEmailVerification()) {
    return <Navigate to="/verify-email-pending" replace />;
  }
  return <>{children}</>;
}

function AppShell() {
  const [error, setError] = useState<string | undefined>(undefined);
  const location = useLocation();
  const { navHidden } = useUiChrome();

  const hideNav =
    navHidden ||
    [
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/verify-email-pending",
      "/verify-email",
      "/progression",
      "/import",
      "/upgrade",
      "/privacy",
      "/terms",
      "/account-deletion",
      "/legal",
    ].includes(location.pathname) ||
    location.pathname.startsWith("/session/") ||
    location.pathname.startsWith("/exercise/");

  const getApiHealth = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (!response.ok) {
        throw new Error("API is not healthy");
      }
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
  };

  useEffect(() => {
    getApiHealth();
  }, []);

  useEffect(() => {
    const prefetch = () => ALL_PAGES.forEach((page) => page.preload());
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    // Older WebViews without requestIdleCallback.
    const timeout = setTimeout(prefetch, 2000);
    return () => clearTimeout(timeout);
  }, []);

  // Without this, Android's hardware/gesture back button exits the app
  // immediately from any screen instead of navigating back within the SPA.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        CapacitorApp.exitApp();
      }
    });
    return () => {
      listener.then((l) => l.remove());
    };
  }, []);

  return (
    <RestTimerProvider>
      {error && <Alert message={error} />}
      <GlobalRestTimer />
      <OfflineBanner />
      <NetworkIndicator />
      <UpdateGate />
      <div className="min-h-screen bg-[#e8e0d8] flex justify-center">
        <div className="w-full min-h-screen bg-[#faf6f1] relative">
          <Suspense fallback={<FullPageSpinner />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/session/:sessionId"
              element={
                <ProtectedRoute>
                  <SessionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stats"
              element={
                <ProtectedRoute>
                  <StatsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profil"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exercises"
              element={
                <ProtectedRoute>
                  <ExercisesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exercise/:exerciseId"
              element={
                <ProtectedRoute>
                  <ExerciseDetailPage />
                </ProtectedRoute>
              }
            />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email-pending" element={<VerifyEmailPendingPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/account-deletion" element={<AccountDeletionPage />} />
            <Route path="/legal" element={<LegalNoticePage />} />
            <Route
              path="/progression"
              element={
                <ProtectedRoute>
                  <ProgressPhotosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/import"
              element={
                <ProtectedRoute>
                  <ImportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upgrade"
              element={
                <ProtectedRoute>
                  <UpgradePage />
                </ProtectedRoute>
              }
            />
          </Routes>
          </Suspense>
          {!hideNav && <BottomNav />}
        </div>
      </div>
    </RestTimerProvider>
  );
}

function App() {
  return (
    <UiChromeProvider>
      <AppShell />
    </UiChromeProvider>
  );
}

export default App;
