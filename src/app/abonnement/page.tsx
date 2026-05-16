"use client";

import { useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cineradar_token");
}

const FEATURES_FREE = [
  "Séances & horaires en temps réel",
  "Favoris, watchlist, films vus",
  "Listes thématiques",
  "Alertes séances",
];

const FEATURES_PRO = [
  "Tout ce qui est inclus dans Gratuit",
  "CinéScope — statistiques avancées",
  "Affiches personnalisées (vitrine)",
  "Listes collaboratives",
  "Accès prioritaire aux nouvelles fonctions",
];

export default function AbonnementPage() {
  const [loading, setLoading] = useState<"monthly" | "annual" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (plan: "monthly" | "annual") => {
    const token = getToken();
    if (!token) {
      window.location.href = "/profil";
      return;
    }
    setLoading(plan);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      window.location.href = data.url;
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="px-4 py-12 mx-auto" style={{ maxWidth: 780 }}>
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-sm font-semibold mb-3" style={{ color: "var(--red)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Abonnement
        </p>
        <h1 className="text-4xl font-extrabold mb-4" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
          Passez à CinéRadar Pro
        </h1>
        <p className="text-base" style={{ color: "var(--text-3)", maxWidth: 480, margin: "0 auto" }}>
          Débloquez toutes les fonctionnalités pour vivre pleinement votre passion du cinéma.
        </p>
      </div>

      {/* Cartes */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">

        {/* Gratuit */}
        <div
          className="rounded-2xl p-6 flex flex-col"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-bold mb-2" style={{ color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Gratuit</p>
          <div className="mb-6">
            <span className="text-4xl font-extrabold" style={{ color: "var(--text)" }}>0 €</span>
            <span className="text-sm ml-1" style={{ color: "var(--text-3)" }}>/ mois</span>
          </div>
          <ul className="flex flex-col gap-2.5 mb-6 flex-1">
            {FEATURES_FREE.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-2)" }}>
                <span style={{ color: "#6b7280", flexShrink: 0 }}>✓</span>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/profil"
            className="block text-center py-2.5 rounded-xl text-sm font-semibold no-underline"
            style={{ background: "var(--bg-3)", color: "var(--text-2)", border: "1px solid var(--border)" }}
          >
            Votre plan actuel
          </Link>
        </div>

        {/* Pro */}
        <div
          className="rounded-2xl p-6 flex flex-col relative overflow-hidden"
          style={{ background: "var(--bg-2)", border: "2px solid var(--red)" }}
        >
          {/* Badge populaire */}
          <div
            className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: "var(--red)", color: "white" }}
          >
            Recommandé
          </div>

          <p className="text-xs font-bold mb-2" style={{ color: "var(--red)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Pro</p>

          {/* Sélecteur mensuel / annuel */}
          <div className="mb-6">
            <div className="flex items-end gap-3 mb-4">
              <div>
                <span className="text-4xl font-extrabold" style={{ color: "var(--text)" }}>5,99 €</span>
                <span className="text-sm ml-1" style={{ color: "var(--text-3)" }}>/ mois</span>
              </div>
              <span className="text-xs mb-1.5" style={{ color: "var(--text-3)" }}>ou</span>
              <div>
                <span className="text-2xl font-bold" style={{ color: "var(--text)" }}>60 €</span>
                <span className="text-sm ml-1" style={{ color: "var(--text-3)" }}>/ an</span>
                <span
                  className="ml-1.5 px-1.5 py-0.5 rounded text-xs font-bold"
                  style={{ background: "#dcfce7", color: "#15803d" }}
                >
                  −16 %
                </span>
              </div>
            </div>
          </div>

          <ul className="flex flex-col gap-2.5 mb-6 flex-1">
            {FEATURES_PRO.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-2)" }}>
                <span style={{ color: "var(--red)", flexShrink: 0 }}>✓</span>
                {f}
              </li>
            ))}
          </ul>

          {error && (
            <p className="text-xs mb-3 text-center" style={{ color: "var(--red)" }}>{error}</p>
          )}

          {/* CTA mensuel */}
          <button
            onClick={() => handleCheckout("monthly")}
            disabled={!!loading}
            className="w-full py-3 rounded-xl text-sm font-bold text-white mb-2"
            style={{ background: "var(--red)", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading === "annual" ? 0.5 : 1 }}
          >
            {loading === "monthly" ? "Redirection…" : "S'abonner — 5,99 € / mois"}
          </button>

          {/* CTA annuel */}
          <button
            onClick={() => handleCheckout("annual")}
            disabled={!!loading}
            className="w-full py-3 rounded-xl text-sm font-bold"
            style={{
              background: "transparent",
              border: "1.5px solid var(--red)",
              color: "var(--red)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading === "monthly" ? 0.5 : 1,
            }}
          >
            {loading === "annual" ? "Redirection…" : "S'abonner — 60 € / an (−16 %)"}
          </button>
        </div>
      </div>

      {/* Garanties */}
      <div className="flex flex-wrap justify-center gap-6 text-xs" style={{ color: "var(--text-3)" }}>
        <span>🔒 Paiement sécurisé par Stripe</span>
        <span>❌ Annulation à tout moment</span>
        <span>🇫🇷 Support en français</span>
      </div>
    </div>
  );
}
