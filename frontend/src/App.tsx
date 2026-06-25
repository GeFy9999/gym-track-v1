import { Header } from "./components/header/Header";
import { Alert } from "./components/Alert";
import { Content } from "./components/Content";
import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import "./index.css";
import DashboardPage from "./pages/Dashboard";
import BottomNav from "./components/bottomNav/index.tsx";

const API_URL = "http://localhost:3000/api";

function App() {
  const [error, setError] = useState<string | undefined>(undefined);

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
    console.log("error", error);
    getApiHealth();
  }, [error]);

  return (
    <>
      {error && <Alert message={error} />}
      <div className="test">
        <Routes>
          <Route path="/" element={<Content />} />
          <Route path="/Dashboard" element={<DashboardPage />} />
        </Routes>
        <BottomNav />
      </div>
    </>
  );
}

export default App;
