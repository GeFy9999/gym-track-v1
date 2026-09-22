import { createContext, useContext, useState, type ReactNode } from "react";

type UiChromeContextValue = {
  navHidden: boolean;
  setNavHidden: (hidden: boolean) => void;
};

const UiChromeContext = createContext<UiChromeContextValue | null>(null);

export function UiChromeProvider({ children }: { children: ReactNode }) {
  const [navHidden, setNavHidden] = useState(false);

  return (
    <UiChromeContext.Provider value={{ navHidden, setNavHidden }}>
      {children}
    </UiChromeContext.Provider>
  );
}

export function useUiChrome() {
  const ctx = useContext(UiChromeContext);
  if (!ctx) {
    throw new Error("useUiChrome must be used within a UiChromeProvider");
  }
  return ctx;
}
