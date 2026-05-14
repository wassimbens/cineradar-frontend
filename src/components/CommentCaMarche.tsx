"use client";

import { useState } from "react";

const STEPS = [
  {
    num: "01",
    icon: "🔍",
    titre: "Cherchez un film",
    desc: "Tapez le titre d'un film dans la barre de recherche — même un classique que vous aimeriez revoir en salle.",
  },
  {
    num: "02",
    icon: "🎬",
    titre: "Vérifiez s'il est à l'affiche",
    desc: "Si le film passe en ce moment, vous verrez directement les cinémas et les horaires disponibles près de chez vous.",
  },
  {
    num: "03",
    icon: "🔔",
    titre: "Créez une alerte",
    desc: "Si le film n'est pas programmé, cliquez sur « M'alerter » sur la fiche du film. Vous serez notifié par email dès qu'il repasse en salle.",
  },
  {
    num: "04",
    icon: "📩",
    titre: "Recevez votre email",
    desc: "Dès qu'un cinéma programme le film, vous recevez un email avec les séances disponibles et un lien pour réserver.",
  },
];

export default function CommentCaMarche() {
  const [open, setOpen] = useState(false);

  return (
    <section className="mb-14">
      {/* Bouton déclencheur */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left card p-5 flex items-center justify-between gap-4"
        style={{
          borderRadius: 12,
          cursor: "pointer",
          background: open ? "var(--bg-2)" : "var(--bg-2)",
          border: "1px solid var(--border)",
          transition: "box-shadow 0.15s",
        }}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="font-bold text-sm" style={{ color: "var(--text)" }}>
              Comment être prévenu quand un film repasse ?
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
              Créez une alerte gratuite en 30 secondes
            </p>
          </div>
        </div>
        <span
          style={{
            display: "inline-block",
            color: "var(--text-3)",
            fontSize: "0.7rem",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            flexShrink: 0,
          }}
        >
          ▼
        </span>
      </button>

      {/* Contenu accordéon */}
      {open && (
        <div
          className="mt-3 p-5 rounded-xl"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm mb-6" style={{ color: "var(--text-3)" }}>
            CinéRadar surveille la programmation de tous les cinémas français. Voici comment recevoir une notification dès qu&apos;un film vous intéresse est à l&apos;affiche.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="p-4 rounded-xl"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
              >
                {/* Numéro */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-xs font-extrabold px-2 py-0.5 rounded"
                    style={{ background: "var(--red)", color: "white", letterSpacing: "0.05em" }}
                  >
                    {step.num}
                  </span>
                  <span className="text-xl">{step.icon}</span>
                </div>
                {/* Titre */}
                <p className="font-bold text-sm mb-1.5" style={{ color: "var(--text)" }}>
                  {step.titre}
                </p>
                {/* Description */}
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-xs text-center" style={{ color: "var(--text-3)" }}>
              Les alertes sont gratuites.{" "}
              <a
                href="/alertes"
                className="no-underline font-semibold"
                style={{ color: "var(--red)" }}
              >
                Voir mes alertes →
              </a>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
