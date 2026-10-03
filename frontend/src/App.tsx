import { Alert } from "./components/Alert";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "./index.css";
import DashboardPage from "./pages/Dashboard";
import BottomNav from "./components/bottomNav/index.tsx";
import StatsPage from "./pages/Stats.tsx";
import LoginPage from "./pages/Login.tsx";
import RegisterPage from "./pages/Register.tsx";
import SessionPage from "./pages/Session.tsx";
import HistoryPage from "./pages/History.tsx";
import ProfilePage from "./pages/Profile.tsx";
import { API_URL } from "./lib/api";
import ForgotPasswordPage from "./pages/ForgotPassword.tsx";
import ResetPasswordPage from "./pages/ResetPassword.tsx";
import VerifyEmailPendingPage from "./pages/VerifyEmailPending.tsx";
import VerifyEmailPage from "./pages/VerifyEmail.tsx";
import ProgressPhotosPage from "./pages/ProgressPhotos.tsx";
import ImportPage from "./pages/Import.tsx";
import ExercisesPage from "./pages/Exercises.tsx";
import ExerciseDetailPage from "./pages/ExerciseDetail.tsx";
import UpgradePage from "./pages/Upgrade.tsx";
import PrivacyPolicyPage from "./pages/PrivacyPolicy.tsx";
import TermsOfServicePage from "./pages/TermsOfService.tsx";
import AccountDeletionPage from "./pages/AccountDeletion.tsx";
import LegalNoticePage from "./pages/LegalNotice.tsx";
import { RestTimerProvider, useRestTimerContext } from "./contexts/RestTimerContext";
import { UiChromeProvider, useUiChrome } from "./contexts/UiChromeContext";
import RestTimer from "./components/session/RestTimer";
import OfflineBanner from "./components/OfflineBanner";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";

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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const { skip: stopRestTimer } = useRestTimerContext();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setChecking(false);
      return;
    }

    fetch(`${API_URL}/sessions/me/streak`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) {
          setValid(true);
          // A stored user predating this check (or one that hasn't verified
          // yet) might not have this flag cached — read it fresh here
          // rather than trusting a possibly-stale localStorage snapshot.
          const stored = localStorage.getItem("user");
          if (stored && JSON.parse(stored).emailVerified === false) {
            setNeedsVerification(true);
          }
        } else {
          localStorage.clear();
          stopRestTimer();
        }
        setChecking(false);
      })
      .catch(() => {
        localStorage.clear();
        stopRestTimer();
        setChecking(false);
      });
  }, [stopRestTimer]);

  if (checking) return null;
  if (!valid) return <Navigate to="/login" replace />;
  if (needsVerification) return <Navigate to="/verify-email-pending" replace />;
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
      <div className="min-h-screen bg-[#e8e0d8] flex justify-center">
        <div className="w-full max-w-[430px] min-h-screen bg-[#faf6f1] relative shadow-2xl">
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
