"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/components/auth-provider";

const STORAGE_KEY = "capsule-me:dev-mode";
const DEV_EMAIL = "lcm0125@dgu.ac.kr";

type DevModeContextValue = {
  devMode: boolean;
  canUseDevMode: boolean;
  toggleDevMode: () => void;
};

const DevModeContext = createContext<DevModeContextValue | null>(null);

function isDevAccount(email: string | null | undefined) {
  return email?.trim().toLowerCase() === DEV_EMAIL;
}

export function DevModeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const canUseDevMode = isDevAccount(user?.email);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!canUseDevMode) {
      setEnabled(false);
      return;
    }
    setEnabled(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, [canUseDevMode]);

  const toggleDevMode = useCallback(() => {
    if (!canUseDevMode) return;
    setEnabled((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, [canUseDevMode]);

  const value = useMemo(
    () => ({
      devMode: canUseDevMode && enabled,
      canUseDevMode,
      toggleDevMode,
    }),
    [canUseDevMode, enabled, toggleDevMode],
  );

  return (
    <DevModeContext.Provider value={value}>{children}</DevModeContext.Provider>
  );
}

export function useDevMode() {
  const context = useContext(DevModeContext);
  if (!context) {
    throw new Error("useDevMode must be used within DevModeProvider");
  }
  return context;
}

export function DevModeToggle() {
  const { canUseDevMode, devMode, toggleDevMode } = useDevMode();
  if (!canUseDevMode) return null;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={devMode}
      onClick={toggleDevMode}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${
        devMode
          ? "bg-emerald-700 text-emerald-50 ring-emerald-800"
          : "bg-white/80 text-stone-500 ring-stone-200 hover:text-stone-700"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${devMode ? "bg-emerald-200" : "bg-stone-300"}`}
      />
      개발자 모드 {devMode ? "켜짐" : "꺼짐"}
    </button>
  );
}
