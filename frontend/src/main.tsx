import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import i18n from "./i18n";
import App from "./App.tsx";

// A signed-in account's saved language always wins over whatever the browser
// locale detector guessed, so a returning user sees their own preference
// (set in Profile) rather than the visitor default on every reload.
try {
  const stored = localStorage.getItem("user");
  const savedLanguage = stored ? JSON.parse(stored)?.language : null;
  if (savedLanguage && savedLanguage !== i18n.language) {
    i18n.changeLanguage(savedLanguage);
  }
} catch {
  // Corrupt localStorage shouldn't block the app from booting.
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
