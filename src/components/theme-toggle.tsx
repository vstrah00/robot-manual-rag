"use client";

import { useLayoutEffect, useRef, useState } from "react";

type Theme = "light" | "dark";
const storageKey = "rover-theme";
const validTheme = (value: string | null): Theme | null =>
  value === "light" || value === "dark" ? value : null;

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const preference = useRef<Theme | null>(null);

  useLayoutEffect(() => {
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    try { preference.current = validTheme(localStorage.getItem(storageKey)); }
    catch { /* The switch still works when browser storage is unavailable. */ }
    function apply() {
      const theme = preference.current ?? (system.matches ? "dark" : "light");
      document.documentElement.dataset.theme = theme;
      setDark(theme === "dark");
    }
    function stored(event: StorageEvent) {
      if (event.key === storageKey || event.key === null) {
        preference.current = validTheme(event.newValue);
        apply();
      }
    }
    apply();
    system.addEventListener("change", apply);
    window.addEventListener("storage", stored);
    return () => {
      system.removeEventListener("change", apply);
      window.removeEventListener("storage", stored);
    };
  }, []);

  function toggle() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    preference.current = next;
    document.documentElement.dataset.theme = next;
    setDark(next === "dark");
    try { localStorage.setItem(storageKey, next); }
    catch { /* Keep the current choice for this page even without storage. */ }
  }

  return (
    <button type="button" className="theme-toggle" onClick={toggle}
      aria-label="Dark mode" aria-pressed={dark}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}>
      <svg className="theme-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M20.5 13.1A8.7 8.7 0 0 1 10.9 3.5 8.8 8.8 0 1 0 20.5 13.1Z" />
      </svg>
      <svg className="theme-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5" />
      </svg>
    </button>
  );
}
