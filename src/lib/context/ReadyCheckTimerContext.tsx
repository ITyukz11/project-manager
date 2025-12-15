"use client";
import React, { createContext, useContext, useMemo, useState } from "react";

type ReadyCheckTimerContextValue = {
  timerSeconds: number;
  setTimerSeconds: (s: number) => void;
};

const ReadyCheckTimerContext =
  createContext<ReadyCheckTimerContextValue | null>(null);

export const ReadyCheckTimerProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [timerSeconds, setTimerSeconds] = useState<number>(30);
  const value = useMemo(
    () => ({ timerSeconds, setTimerSeconds }),
    [timerSeconds]
  );
  return (
    <ReadyCheckTimerContext.Provider value={value}>
      {children}
    </ReadyCheckTimerContext.Provider>
  );
};

export function useReadyCheckTimer() {
  const ctx = useContext(ReadyCheckTimerContext);
  if (!ctx) {
    throw new Error(
      "useReadyCheckTimer must be used within a ReadyCheckTimerProvider"
    );
  }
  return ctx;
}
