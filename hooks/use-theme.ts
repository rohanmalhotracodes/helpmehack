"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const storageKey = "helpmehack:theme";
const channel = "helpmehack:theme-change";
const dayStartsAt = 7;
const nightStartsAt = 19;

export function themeForLocalTime(date: Date): Theme {
  const hour = date.getHours();
  return hour >= dayStartsAt && hour < nightStartsAt ? "light" : "dark";
}

function millisecondsUntilThemeChange(date = new Date()) {
  const next = new Date(date);
  if (date.getHours() < dayStartsAt) next.setHours(dayStartsAt, 0, 0, 0);
  else if (date.getHours() < nightStartsAt) next.setHours(nightStartsAt, 0, 0, 0);
  else {
    next.setDate(next.getDate() + 1);
    next.setHours(dayStartsAt, 0, 0, 0);
  }
  return Math.max(1_000, next.getTime() - date.getTime());
}

function getTheme(): Theme {
  const stored = window.localStorage.getItem(storageKey);
  if (stored) {
    try {
      const override = JSON.parse(stored) as { theme?: Theme; expiresAt?: number };
      if ((override.theme === "light" || override.theme === "dark") && typeof override.expiresAt === "number" && override.expiresAt > Date.now()) return override.theme;
    } catch {
      // Older permanent preferences are ignored so the clock-based default can take effect.
    }
  }
  return themeForLocalTime(new Date());
}

export function useTheme() {
  const theme = useSyncExternalStore<Theme>(
    useCallback((onChange) => {
      const storage = (event: StorageEvent) => { if (event.key === storageKey) onChange(); };
      let timer: ReturnType<typeof setTimeout>;
      const scheduleClockChange = () => {
        timer = setTimeout(() => {
          onChange();
          scheduleClockChange();
        }, millisecondsUntilThemeChange());
      };
      window.addEventListener("storage", storage);
      window.addEventListener(channel, onChange);
      scheduleClockChange();
      return () => {
        clearTimeout(timer);
        window.removeEventListener("storage", storage);
        window.removeEventListener(channel, onChange);
      };
    }, []),
    getTheme,
    (): Theme => "dark",
  );

  const toggleTheme = useCallback(() => {
    window.localStorage.setItem(storageKey, JSON.stringify({
      theme: theme === "dark" ? "light" : "dark",
      expiresAt: Date.now() + millisecondsUntilThemeChange(),
    }));
    window.dispatchEvent(new Event(channel));
  }, [theme]);

  return { theme, toggleTheme };
}
