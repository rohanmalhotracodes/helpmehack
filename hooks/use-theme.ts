"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const storageKey = "helpmehack:theme";
const channel = "helpmehack:theme-change";

function getTheme(): Theme {
  const stored = window.localStorage.getItem(storageKey);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function useTheme() {
  const theme = useSyncExternalStore<Theme>(
    useCallback((onChange) => {
      const media = window.matchMedia("(prefers-color-scheme: light)");
      const storage = (event: StorageEvent) => { if (event.key === storageKey) onChange(); };
      window.addEventListener("storage", storage);
      window.addEventListener(channel, onChange);
      media.addEventListener("change", onChange);
      return () => {
        window.removeEventListener("storage", storage);
        window.removeEventListener(channel, onChange);
        media.removeEventListener("change", onChange);
      };
    }, []),
    getTheme,
    (): Theme => "dark",
  );

  const toggleTheme = useCallback(() => {
    window.localStorage.setItem(storageKey, theme === "dark" ? "light" : "dark");
    window.dispatchEvent(new Event(channel));
  }, [theme]);

  return { theme, toggleTheme };
}
