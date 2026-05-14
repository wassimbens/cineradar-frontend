"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { SeancesParCinema, ProgrammeLigne, formatHeure, formatPrix } from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cineradar.fr";

/** Bouton de partage d'une séance — Web Share API ou copie dans le presse-papier */
function ShareButton({ filmId, filmTitre, cinema }: { filmId: string; filmTitre: string; cinema: SeancesParCinema["cinema"] }) {
  const [copied, setCopied] = useState(false);

  const share = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const url   = `${SITE_URL}/films/${filmId}?date=${today}`;
    const text  = `${filmTitre} au ${cinema.nom} (${cinema.ville}) — séances sur CinéRadar`;

    if (navigator.share) {
      try { await navigator.share({ title: filmTitre, text, url }); } catch { /* annulé */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [filmId, filmTitre, cinema]);

  return (
    <button
      onClick={(e) => { e.stopPropagation(); share(); }}
      title="Partager ces séances"
      style={{
        background: "var(--bg-3)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: "2px 8px",
        fontSize: "0.7rem",
        cursor: "pointer",
        color: copied ? "var(--red)" : "var(--text-3)",
        whiteSpace: "nowrap",
        transition: "color 0.2s",
        flexShrink: 0,
      }}
    >
      {copied ? "✓ Copié !" : "↗ Partager"}
    </button>
  );
}

function VersionBadge({ version }: { version: string }) {
  const colors: Record<string, string> = {
    VO: "#2563eb",
    VOSTFR: "#7c3aed",
    VF: "#16a34a",
  };
  return (
    <span
      className="text-xs font-semibold px-1.5 py-0.5 rounded"
      style={{
        background: colors[version] ?? "var(--bg-3)",
        color: "white",
        fontSize: "0.65rem",
      }}
    >
      {version}
    </span>
  );
}

/** Affiche les séances d'un film groupées par cinéma — avec accordéon */
export function SeanceGroupByCinema({
  groupe,
  filmId,
  filmTitre,
}: {
  groupe: SeancesParCinema;
  filmId?: string;
  filmTitre?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="card overflow-hidden"
      style={{ borderRadius: 10, transition: "box-shadow 0.15s" }}
    >
      {/* ── En-tête cliquable ── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
        aria-expanded={expanded}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <Link
            href={`/cinemas/${groupe.cinema.id}`}
            className="font-semibold text-sm no-underline truncate"
            style={{ color: "var(--text)" }}
            onClick={(e) => e.stopPropagation()} // ne pas toggler l'accordéon en cliquant le lien
          >
            {groupe.cinema.nom}
          </Link>
          <span className="text-xs" style={{ color: "var(--text-3)" }}>
            {groupe.cinema.ville}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          {/* Bouton partager */}
          {filmId && filmTitre && (
            <ShareButton filmId={filmId} filmTitre={filmTitre} cinema={groupe.cinema} />
          )}

          {/* Compteur de séances */}
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: "var(--bg-3)",
              color: "var(--text-3)",
              border: "1px solid var(--border)",
              whiteSpace: "nowrap",
            }}
          >
            {groupe.seances.length} séance{groupe.seances.length > 1 ? "s" : ""}
          </span>

          {/* Chevron animé */}
          <span
            style={{
              display: "inline-block",
              color: "var(--text-3)",
              fontSize: "0.7rem",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            ▼
          </span>
        </div>
      </button>

      {/* ── Détail des séances (accordéon) ── */}
      {expanded && (
        <div
          className="flex flex-wrap gap-2 px-4 pb-4"
          style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}
        >
          {groupe.seances.map((s) => (
            <div
              key={s.id}
              className="slot flex flex-col items-center gap-1"
              style={{ minWidth: 64 }}
            >
              <span className="font-bold text-sm">{formatHeure(s.dateHeure)}</span>
              <VersionBadge version={s.version} />
              {s.prix && (
                <span className="text-xs" style={{ color: "var(--text-3)" }}>
                  {formatPrix(s.prix)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Affiche les séances d'un cinéma groupées par film */
export function SeanceGroupByFilm({ ligne }: { ligne: ProgrammeLigne }) {
  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: 12,
        background: "var(--bg-2)",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "stretch",
        width: "100%",
      }}
    >
      {/* Affiche — 90px fixe, hauteur auto */}
      <Link
        href={`/films/${ligne.film.id}`}
        className="no-underline flex-shrink-0"
        style={{ width: 90, display: "block", position: "relative", minHeight: 130 }}
        tabIndex={-1}
        aria-hidden
      >
        {ligne.film.affiche ? (
          <Image
            src={ligne.film.affiche}
            alt={ligne.film.titre}
            fill
            style={{ objectFit: "cover", objectPosition: "center top" }}
            sizes="90px"
          />
        ) : (
          <div
            style={{
              width: "100%", height: "100%", minHeight: 130,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.8rem", background: "var(--bg-3)",
            }}
          >
            🎬
          </div>
        )}
      </Link>

      {/* Contenu — prend tout l'espace restant */}
      <div style={{ flex: 1, padding: "12px 14px", minWidth: 0 }}>
        <Link
          href={`/films/${ligne.film.id}`}
          className="no-underline"
          style={{
            display: "block", marginBottom: 10,
            fontWeight: 700, fontSize: "0.82rem",
            color: "var(--text)", textTransform: "uppercase",
            letterSpacing: "0.04em", lineHeight: 1.3,
          }}
        >
          {ligne.film.titre}
        </Link>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ligne.seances.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 4, minWidth: 56,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text)" }}>
                {formatHeure(s.dateHeure)}
              </span>
              <VersionBadge version={s.version} />
              {s.prix && (
                <span style={{ fontSize: "0.7rem", color: "var(--text-3)" }}>
                  {formatPrix(s.prix)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
