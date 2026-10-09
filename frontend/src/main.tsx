import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
// Self-hosted (bundled) font: no request to Google Fonts, which would send
// every visitor's IP address to Google.
import "@fontsource-variable/outfit";
import "./index.css";
import i18n from "./i18n";
import App from "./App.tsx";
import { initSyncQueue } from "./lib/syncQueue";

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

initSyncQueue();

if ("serviceWorker" in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service worker registration failed:", err);
      });
    });
  } else {
    // A service worker left over from a previous production build/preview
    // intercepts Vite's own dev requests (HMR, module fetches), breaking
    // live reload and serving stale code — so dev mode always sheds it.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
