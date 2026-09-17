import { createContext, useContext, type ReactNode } from "react";
import { useRestTimer } from "../hooks/useRestTimer";
import { getRestTimerSeconds } from "../utils/units";

type RestTimerContextValue = {
  secondsLeft: number;
  isActive: boolean;
  start: (seconds?: number) => void;
  skip: () => void;
};

const RestTimerContext = createContext<RestTimerContextValue | null>(null);

export function RestTimerProvider({ children }: { children: ReactNode }) {
  const timer = useRestTimer(getRestTimerSeconds());

  return (
    <RestTimerContext.Provider value={timer}>
      {children}
    </RestTimerContext.Provider>
  );
}

export function useRestTimerContext() {
  const ctx = useContext(RestTimerContext);
  if (!ctx) {
    throw new Error(
      "useRestTimerContext must be used within a RestTimerProvider",
    );
  }
  return ctx;
}
