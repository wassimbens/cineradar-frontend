"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "cineradar_cookie_consent";

type ConsentState = "accepted" | "declined" | null;

export default function CookieBanner() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as ConsentState;
    setConsent(stored);
  }, []);

  if (!mounted || consent !== null) return null;

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setConsent("accepted");
    // Activer les scripts analytiques si ajoutés plus tard
    window.dispatchEvent(new CustomEvent("cineradar:consent", { detail: { analytics: true } }));
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, "declined");
    setConsent("declined");
  };

  return (
    <div
      role="dialog"
      aria-label="Gestion des cookies"
      className="fixed bottom-0 left-0 right-0 z-50 p-4"
      style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}
    >
      <div className="mx-auto flex flex-wrap items-center justify-between gap-4" style={{ maxWidth: 1100 }}>
        <div className="flex-1" style={{ minWidth: 260 }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
            🍪 Ce site utilise des cookies
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
            CinéRadar n&apos;utilise que des cookies <strong>strictement nécessaires</strong> au
            fonctionnement du service (session d&apos;authentification, préférence de thème).
            Aucun cookie publicitaire ou de tracking n&apos;est utilisé.{" "}
            <Link href="/legal/confidentialite" className="underline" style={{ color: "var(--red)" }}>
              En savoir plus
            </Link>
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              color: "var(--text-2)",
              cursor: "pointer",
            }}
          >
            Fermer
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--red)", cursor: "pointer" }}
          >
            J&apos;ai compris
          </button>
        </div>
      </div>
    </div>
  );
}
