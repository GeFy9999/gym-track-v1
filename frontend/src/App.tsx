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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);

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
        } else {
          localStorage.clear();
        }
        setChecking(false);
      })
      .catch(() => {
        localStorage.clear();
        setChecking(false);
      });
  }, []);

  if (checking) return null;
  if (!valid) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  const [error, setError] = useState<string | undefined>(undefined);
  const location = useLocation();

  const hideNav =
    ["/login", "/register"].includes(location.pathname) ||
    location.pathname.startsWith("/session/");

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

  return (
    <>
      {error && <Alert message={error} />}
      <div className="test">
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
        </Routes>
        {!hideNav && <BottomNav />}
      </div>
    </>
  );
}

export default App;
