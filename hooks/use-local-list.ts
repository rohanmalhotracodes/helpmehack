"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

export function useLocalList(key: string) {
  const channel = `helpmehack:storage:${key}`;
  const raw = useSyncExternalStore(
    useCallback((onChange) => {
      const handleStorage = (event: StorageEvent) => { if (event.key === key) onChange(); };
      window.addEventListener("storage", handleStorage);
      window.addEventListener(channel, onChange);
      return () => { window.removeEventListener("storage", handleStorage); window.removeEventListener(channel, onChange); };
    }, [channel, key]),
    useCallback(() => window.localStorage.getItem(key) ?? "[]", [key]),
    () => "[]",
  );
  const items = useMemo(() => {
    try { return JSON.parse(raw) as string[]; } catch { return []; }
  }, [raw]);

  const toggle = useCallback((id: string) => {
    const currentRaw = window.localStorage.getItem(key) ?? "[]";
    let current: string[] = [];
    try { current = JSON.parse(currentRaw); } catch { /* Replace malformed data. */ }
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    window.localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(new Event(channel));
  }, [channel, key]);

  return { items, toggle, ready: true };
}
