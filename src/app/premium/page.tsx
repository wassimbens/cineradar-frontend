"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const FEATURES_FREE = [
  "Catalogue complet (6 000+ films)",
  "Séances de tous les cinémas",
  "Recherche films & cinémas",
  "Profil public & watchlist illimitée",
  "3 alertes email actives",
  "Note & avis communauté",
  "Stats de base (genres & réalisateurs vus)",
  "Fil d'actualité (7 derniers jours)",
];

const FEATURES_PRO = [
  { icon: "✦", label: "Tout ce qui est gratuit +" },
  { icon: "🔔", label: "Alertes illimitées" },
  { icon: "🚫", label: "Aucune publicité" },
  { icon: "📅", label: "Export calendrier (.ics)" },
  { icon: "🔭", label: "CinéScope — tableau de bord complet : acteurs, cinémas, évolution mensuelle, tendances" },
  { icon: "🎞️", label: "CinéRewind — votre année en chiffres chaque 31 décembre" },
  { icon: "👥", label: "Fil d'activité de vos abonnés (complet)" },
  { icon: "🎨", label: "Affiches personnalisées ✦" },
  { icon: "🗂️", label: "Listes thématiques partageables" },
  { icon: "🎯", label: "Recommandations personnalisées" },
  { icon: "⭐", label: "Badge Pro visible sur le profil public" },
  { icon: "💬", label: "Support prioritaire" },
];

interface AuthUser {
  isPremium?: boolean;
  premiumUntil?: string | null;
  pseudo?: string | null;
  nom?: string | null;
}

export default function PremiumPage() {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [billing, setBilling]   = useState<"monthly" | "yearly">("monthly");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

  const monthlyPrice   = "5,99€";
  const yearlyPrice    = "60€";
  const yearlyPerMonth = "5€";

  // Vérifier si l'utilisateur est déjà Pro
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("cineradar_token") : null;
    if (!token) { setChecking(false); return; }
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then((u: AuthUser | null) => { if (u) setAuthUser(u); })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [API]);

  const startCheckout = async () => {
    setLoading(true);
    setError("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("cineradar_token") : null;
      if (!token) { window.location.href = "/profil?redirect=/premium"; return; }
      const res = await fetch(`${API}/api/stripe/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ billing }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Erreur lors de la création de la session");
      }
      const { url } = await res.json() as { url: string };
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
      setLoading(false);
    }
  };

  const isPro = authUser?.isPremium === true;
  const expiresAt = authUser?.premiumUntil
    ? new Date(authUser.premiumUntil).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  if (checking) {
    return <div className="flex items-center justify-center py-32"><p style={{ color: "var(--text-3)" }}>Chargement…</p></div>;
  }

  // ── Vue abonné actif ────────────────────────────────────
  if (isPro) {
    return (
      <div className="px-6 py-16 mx-auto" style={{ maxWidth: 760 }}>
        {/* En-tête membre Pro */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4" style={{ background: "var(--red)", color: "white" }}>
            <span className="font-bold text-sm">✦ Membre Pro actif</span>
          </div>
          <h1 className="text-4xl font-extrabold mb-3" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
            Bienvenue, {authUser?.nom ?? authUser?.pseudo ?? "cinéphile"} !
          </h1>
          {expiresAt && (
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              Abonnement actif jusqu&apos;au <strong style={{ color: "var(--text)" }}>{expiresAt}</strong>
            </p>
          )}
        </div>

        {/* Carte statut */}
        <div
          className="rounded-2xl p-6 mb-8"
          style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--red) 8%, var(--bg-2)) 0%, var(--bg-2) 100%)", border: "2px solid var(--red)" }}
        >
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <p className="font-bold text-lg" style={{ color: "var(--text)" }}>✦ CinéRadar Pro</p>
              {expiresAt && <p className="text-sm mt-0.5" style={{ color: "var(--text-3)" }}>Renouvellement le {expiresAt}</p>}
            </div>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: "var(--red)", color: "white" }}
            >
              ACTIF
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {FEATURES_PRO.slice(1).map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-2)" }}>
                <span style={{ fontSize: "1rem", flexShrink: 0 }}>{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            { href: "/profil", icon: "🎨", label: "Personnaliser mes affiches", desc: "Changez l'affiche de vos films favoris" },
            { href: "/alertes", icon: "🔔", label: "Gérer mes alertes", desc: "Alertes illimitées sur vos films" },
            { href: "/profil", icon: "📊", label: "Mes statistiques", desc: "Bilan complet de vos visionnages" },
          ].map(({ href, icon, label, desc }) => (
            <Link
              key={label}
              href={href}
              className="no-underline p-4 rounded-xl flex flex-col gap-1 transition-colors"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
            >
              <span className="text-2xl">{icon}</span>
              <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>{label}</span>
              <span className="text-xs" style={{ color: "var(--text-3)" }}>{desc}</span>
            </Link>
          ))}
        </div>

        {/* Gérer l'abonnement */}
        <div className="text-center p-6 rounded-2xl" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
          <p className="font-semibold text-sm mb-1" style={{ color: "var(--text)" }}>Gérer votre abonnement</p>
          <p className="text-xs mb-4" style={{ color: "var(--text-3)" }}>
            Modifiez ou annulez votre abonnement via le portail Stripe.
          </p>
          <a
            href={`${API}/api/stripe/portal`}
            className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold no-underline"
            style={{ background: "var(--bg-3)", color: "var(--text-2)", border: "1px solid var(--border)" }}
          >
            Gérer via Stripe →
          </a>
        </div>
      </div>
    );
  }

  // ── Vue abonnement (non-Pro) ────────────────────────────
  return (
    <div className="px-6 py-16 mx-auto" style={{ maxWidth: 960 }}>
      {/* En-tête */}
      <div className="text-center mb-14">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--red)" }}>
          CinéRadar Pro
        </p>
        <h1 className="text-4xl font-extrabold mb-4" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
          Cinéphile sans limite
        </h1>
        <p className="text-base max-w-md mx-auto" style={{ color: "var(--text-2)", lineHeight: 1.6 }}>
          Débloquez toutes les fonctionnalités pour suivre vos séances,
          recevoir des alertes illimitées et personnaliser votre expérience.
        </p>
      </div>

      {/* Toggle mensuel / annuel */}
      <div className="flex justify-center mb-10">
        <div className="flex items-center rounded-xl p-1 gap-1" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
          <button
            onClick={() => setBilling("monthly")}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: billing === "monthly" ? "var(--red)" : "transparent", color: billing === "monthly" ? "white" : "var(--text-2)", border: "none", cursor: "pointer" }}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
            style={{ background: billing === "yearly" ? "var(--red)" : "transparent", color: billing === "yearly" ? "white" : "var(--text-2)", border: "none", cursor: "pointer" }}
          >
            Annuel
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: billing === "yearly" ? "rgba(255,255,255,0.25)" : "var(--red)", color: "white", fontSize: "0.6rem", letterSpacing: "0.05em" }}>
              −16%
            </span>
          </button>
        </div>
      </div>

      {/* Comparatif */}
      <div className="grid gap-6 sm:grid-cols-2 mb-12" style={{ maxWidth: 720, margin: "0 auto 3rem" }}>
        {/* Gratuit */}
        <div className="card p-6 rounded-2xl" style={{ border: "1px solid var(--border)" }}>
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-3)" }}>Gratuit</p>
            <p className="text-3xl font-extrabold" style={{ color: "var(--text)" }}>
              0€ <span className="text-sm font-normal" style={{ color: "var(--text-3)" }}>/ mois</span>
            </p>
          </div>
          <ul className="space-y-2.5">
            {FEATURES_FREE.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-2)" }}>
                <span style={{ color: "var(--text-3)", flexShrink: 0 }}>✓</span>
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Link href="/profil" className="block w-full text-center px-4 py-2.5 rounded-xl text-sm font-semibold no-underline" style={{ background: "var(--bg-3)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
              Commencer gratuitement
            </Link>
          </div>
        </div>

        {/* Pro */}
        <div className="card p-6 rounded-2xl relative" style={{ border: "2px solid var(--red)", background: "linear-gradient(135deg, color-mix(in srgb, var(--red) 5%, var(--bg)) 0%, var(--bg) 100%)" }}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: "var(--red)" }}>
            Recommandé
          </div>
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--red)" }}>Pro</p>
            {billing === "monthly" ? (
              <>
                <p className="text-3xl font-extrabold" style={{ color: "var(--text)" }}>
                  {monthlyPrice} <span className="text-sm font-normal" style={{ color: "var(--text-3)" }}>/ mois</span>
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Résiliable à tout moment</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-extrabold" style={{ color: "var(--text)" }}>
                  {yearlyPrice} <span className="text-sm font-normal" style={{ color: "var(--text-3)" }}>/ an</span>
                </p>
                <p className="text-xs mt-1 font-semibold" style={{ color: "var(--red)" }}>soit {yearlyPerMonth}/mois — 2 mois offerts</p>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>Résiliable à tout moment</p>
              </>
            )}
          </div>
          <ul className="space-y-2.5">
            {FEATURES_PRO.map(({ icon, label }, i) => (
              <li key={label} className="flex items-start gap-2 text-sm font-medium" style={{ color: i === 0 ? "var(--text-3)" : "var(--text)" }}>
                <span style={{ flexShrink: 0 }}>{i === 0 ? "" : icon}</span>
                {label}
              </li>
            ))}
          </ul>

          {error && <p className="text-xs mt-3 text-center" style={{ color: "var(--red)" }}>{error}</p>}

          <button
            onClick={startCheckout}
            disabled={loading}
            className="mt-6 w-full px-4 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: "var(--red)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Redirection vers Stripe…" : billing === "monthly" ? `Passer Pro — ${monthlyPrice}/mois` : `Passer Pro — ${yearlyPrice}/an`}
          </button>

          <p className="text-xs text-center mt-2" style={{ color: "var(--text-3)" }}>
            Paiement sécurisé par Stripe · Sans engagement
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-xl mx-auto">
        <h2 className="text-lg font-extrabold mb-5 text-center" style={{ color: "var(--text)" }}>Questions fréquentes</h2>
        {[
          { q: "Puis-je annuler à tout moment ?", r: "Oui, sans pénalité. Vous conservez l'accès Pro jusqu'à la fin de la période payée." },
          { q: "Quelle différence entre mensuel et annuel ?", r: "L'abonnement annuel à 60€ revient à 5€/mois, soit 2 mois offerts. Idéal si vous êtes cinéphile toute l'année." },
          { q: "Comment est prélevé l'abonnement ?", r: "Par carte bancaire via Stripe, chaque mois (ou chaque année) à la date de souscription." },
          { q: "Qu'arrive-t-il à mes données si j'annule ?", r: "Vos films vus, watchlist et avis sont conservés. Seules les fonctionnalités Pro deviennent inaccessibles." },
          { q: "Y a-t-il une période d'essai ?", r: "Pas encore, mais nous prévoyons d'en proposer une prochainement." },
        ].map(({ q, r }) => (
          <div key={q} className="mb-4 p-4 rounded-xl" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
            <p className="font-semibold text-sm mb-1" style={{ color: "var(--text)" }}>{q}</p>
            <p className="text-sm" style={{ color: "var(--text-3)", lineHeight: 1.6 }}>{r}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
