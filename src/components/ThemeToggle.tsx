"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefersDark;
    setDark(isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      title={dark ? "Passer en mode clair" : "Passer en mode sombre"}
      className="flex items-center gap-2 text-sm cursor-pointer"
      style={{ color: "var(--text-3)" }}
    >
      <span>{dark ? "☀️" : "🌙"}</span>
      <div
        style={{
          width: 40, height: 22,
          background: dark ? "var(--red)" : "var(--bg-3)",
          border: `1.5px solid ${dark ? "var(--red)" : "var(--border)"}`,
          borderRadius: 99,
          position: "relative",
          transition: "background 0.25s, border-color 0.25s",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2, left: 2,
            width: 14, height: 14,
            background: "white",
            borderRadius: "50%",
            transform: dark ? "translateX(18px)" : "none",
            transition: "transform 0.25s cubic-bezier(.4,0,.2,1)",
            boxShadow: "0 1px 3px rgba(0,0,0,.2)",
          }}
        />
      </div>
    </button>
  );
}
