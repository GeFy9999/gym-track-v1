import "./index.css";
import { Header } from "./components/header/Header";
import { Alert } from "./components/Alert";
import { Content } from "./components/Content";

import { useEffect, useState } from "react";

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
      <Header />
      <div className="test">
        <Content />
      </div>
    </>
  );
}

export default App;
