import "./index.css";
import { Header } from "./components/Header";
import { Alert } from "./components/Alert";
import { Content } from "./components/Content";

import { useEffect, useState } from "react";

const API_URL = "http://localhost:3000/api";

function App() {
  const [error, setError] = useState(undefined);

  const getApiHealth = async () => {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (!response.ok) {
        throw new Error("API is not healthy");
      }
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    console.log("error", error);
    // run this code if the dependencies change
    // if dependencies are empty, run this code once on mount
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
