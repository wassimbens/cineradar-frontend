"use client";

/**
 * DayPicker
 * ─────────────────────────────────────────────────────────
 * Sélecteur horizontal de date partagé (films + cinémas).
 *  - 30 jours, séparateurs de mois, flèches de scroll
 *  - Auto-scroll vers le jour actif
 *  - Calendrier popover pour saut rapide
 *  - activeDates : contour rouge sur les jours avec séances
 * ─────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState } from "react";

const DEFAULT_COUNT = 30;

// ── Helpers (timezone-safe) ───────────────────────────────

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildDays(count: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function diffDays(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime();
  return Math.round(ms / 86_400_000);
}

const MONTHS_FR = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

// ── Composant ─────────────────────────────────────────────

interface Props {
  /** Date active au format YYYY-MM-DD */
  currentDate: string;
  /** Callback à l'appui sur une pill */
  onSelect: (iso: string) => void;
  /** Nombre de jours à afficher (défaut 30) */
  count?: number;
  /** Classe CSS supplémentaire */
  className?: string;
  /**
   * Dates (YYYY-MM-DD) où au moins une séance existe.
   * Ces jours reçoivent un contour rouge pour guider l'utilisateur.
   */
  activeDates?: string[];
}

export default function DayPicker({
  currentDate,
  onSelect,
  count = DEFAULT_COUNT,
  className = "",
  activeDates,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeRef   = useRef<HTMLButtonElement>(null);
  const [showLeft, setShowLeft]   = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [showCal, setShowCal]     = useState(false);

  const days = buildDays(count);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Set rapide pour les lookups O(1)
  const activeDateSet = activeDates ? new Set(activeDates) : null;

  // Scroll auto vers la pill active au montage / changement
  useEffect(() => {
    if (!activeRef.current || !scrollerRef.current) return;
    const btn = activeRef.current;
    const scroller = scrollerRef.current;
    const offset = btn.offsetLeft - scroller.clientWidth / 2 + btn.clientWidth / 2;
    scroller.scrollTo({ left: Math.max(0, offset), behavior: "smooth" });
  }, [currentDate]);

  // Mise à jour des flèches gauche/droite selon scroll
  useEffect(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const update = () => {
      setShowLeft(sc.scrollLeft > 8);
      setShowRight(sc.scrollLeft + sc.clientWidth < sc.scrollWidth - 8);
    };
    update();
    sc.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      sc.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollBy = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  const showMonthBreak = (i: number): string | null => {
    if (i === 0) return MONTHS_FR[days[0].getMonth()];
    if (days[i].getMonth() !== days[i - 1].getMonth()) {
      return MONTHS_FR[days[i].getMonth()];
    }
    return null;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Header ligne : titre + bouton calendrier */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
            📅 Choisir un jour
          </span>
          {/* Légende contour rouge */}
          {activeDateSet && activeDateSet.size > 0 && (
            <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-3)" }}>
              <span
                className="inline-block w-3 h-3 rounded"
                style={{ border: "2px solid var(--red)", background: "transparent" }}
              />
              séances disponibles
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCal((v) => !v)}
          className="text-xs px-2 py-1 rounded"
          style={{
            background: showCal ? "var(--bg-3)" : "var(--bg-2)",
            border: "1px solid var(--border)",
            color: "var(--text-2)",
            cursor: "pointer",
          }}
          title="Sauter à une date"
        >
          {showCal ? "Fermer le calendrier" : "🗓 Calendrier"}
        </button>
      </div>

      {/* Calendrier popover */}
      {showCal && (
        <div className="mb-3 p-3 rounded-xl" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
          <input
            type="date"
            value={currentDate}
            min={toIso(days[0])}
            max={toIso(days[days.length - 1])}
            onChange={(e) => {
              if (e.target.value) {
                onSelect(e.target.value);
                setShowCal(false);
              }
            }}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              background: "var(--bg-3)",
              color: "var(--text)",
              border: "1px solid var(--border)",
            }}
          />
          <p className="text-xs mt-2" style={{ color: "var(--text-3)" }}>
            Disponible du {days[0].toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            {" "}au {days[days.length - 1].toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </p>
        </div>
      )}

      {/* Flèche gauche */}
      {showLeft && (
        <button
          onClick={() => scrollBy(-200)}
          className="absolute z-10 left-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,.18)",
          }}
          aria-label="Jours précédents"
        >
          ‹
        </button>
      )}

      {/* Flèche droite */}
      {showRight && (
        <button
          onClick={() => scrollBy(200)}
          className="absolute z-10 right-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,.18)",
          }}
          aria-label="Jours suivants"
        >
          ›
        </button>
      )}

      {/* Pills scroller */}
      <div
        ref={scrollerRef}
        className="flex gap-2 overflow-x-auto pb-2 px-1"
        style={{ scrollbarWidth: "none", scrollSnapType: "x mandatory" }}
      >
        {days.map((d, i) => {
          const iso = toIso(d);
          const isActive = iso === currentDate;
          const hasSeance = activeDateSet ? activeDateSet.has(iso) : false;
          const diff = diffDays(d, today);
          const monthBreak = showMonthBreak(i);
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;

          let label: string;
          if (diff === 0) label = "Auj.";
          else if (diff === 1) label = "Demain";
          else label = d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");

          // ── Calcul des styles ──────────────────────────
          let bgColor: string;
          let borderStyle: string;
          let textColor: string;

          if (isActive) {
            // Jour sélectionné → fond rouge plein
            bgColor = "var(--red)";
            borderStyle = "2px solid var(--red)";
            textColor = "white";
          } else if (hasSeance) {
            // Jour avec séances → contour rouge, fond légèrement teinté
            bgColor = "color-mix(in srgb, var(--red) 8%, var(--bg-2))";
            borderStyle = "2px solid var(--red)";
            textColor = "var(--text)";
          } else {
            // Jour sans séances → style normal
            bgColor = "var(--bg-2)";
            borderStyle = `1px solid ${isWeekend ? "var(--text-3)" : "var(--border)"}`;
            textColor = isWeekend ? "var(--text)" : "var(--text-2)";
          }

          return (
            <div key={iso} className="flex flex-col items-center" style={{ scrollSnapAlign: "start" }}>
              {/* Séparateur de mois */}
              {monthBreak ? (
                <span
                  className="text-[10px] uppercase tracking-wider mb-1 font-bold"
                  style={{ color: "var(--text-3)" }}
                >
                  {monthBreak}
                </span>
              ) : (
                <span className="mb-1" style={{ height: "1em" }} />
              )}

              <button
                ref={isActive ? activeRef : undefined}
                onClick={() => onSelect(iso)}
                className="flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: bgColor,
                  color: textColor,
                  border: borderStyle,
                  cursor: "pointer",
                  minWidth: 56,
                  fontWeight: isActive || hasSeance || diff === 0 ? 700 : 500,
                  opacity: isActive ? 1 : 0.95,
                }}
              >
                <span
                  className="text-[10px] uppercase opacity-80"
                  style={{ letterSpacing: 0.5 }}
                >
                  {label}
                </span>
                <span className="text-base font-bold mt-0.5">
                  {d.getDate()}
                </span>
                {/* Point indicateur sous le numéro pour les jours avec séances */}
                {hasSeance && !isActive && (
                  <span
                    className="mt-0.5 rounded-full"
                    style={{ width: 4, height: 4, background: "var(--red)", display: "block" }}
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
