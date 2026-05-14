"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DayPicker from "./DayPicker";

// ── Villes disponibles ────────────────────────────────────

const VILLES = [
  "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes",
  "Strasbourg", "Montpellier", "Bordeaux", "Lille", "Rennes",
  "Reims", "Le Havre", "Saint-Étienne", "Toulon", "Grenoble",
  "Dijon", "Angers", "Nîmes", "Villeurbanne",
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

function formatIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ── Composant ─────────────────────────────────────────────

interface Props {
  filmId: string;
}

export default function SeancesFiltres({ filmId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentDate = searchParams.get("date") ?? formatIso(new Date());
  const currentVille = searchParams.get("ville") ?? "";

  // Dates où le film passe (pour le DayPicker)
  const [activeDates, setActiveDates] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/films/${filmId}/dates`)
      .then((r) => r.ok ? r.json() : { dates: [] })
      .then((data: { dates?: string[] }) => setActiveDates(data.dates ?? []))
      .catch(() => {});
  }, [filmId]);

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
        // Mémoriser la ville choisie pour la personnalisation de la home
        if (key === "ville") {
          try { localStorage.setItem("cineradar_ville", value); } catch { /* silencieux */ }
        }
      } else {
        params.delete(key);
      }
      router.push(`/films/${filmId}?${params.toString()}`, { scroll: false });
    },
    [filmId, router, searchParams]
  );

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Filtre ville */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium flex-shrink-0" style={{ color: "var(--text-2)" }}>
          Ville
        </span>
        <div className="relative flex-1" style={{ maxWidth: 260 }}>
          <select
            value={currentVille}
            onChange={(e) => updateParams("ville", e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg text-sm appearance-none pr-8"
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              color: currentVille ? "var(--text)" : "var(--text-3)",
              cursor: "pointer",
            }}
          >
            <option value="">Toutes les villes</option>
            {VILLES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <span
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: "var(--text-3)" }}
          >
            ▼
          </span>
        </div>
        {currentVille && (
          <button
            onClick={() => updateParams("ville", "")}
            className="text-xs px-2 py-1 rounded"
            style={{ color: "var(--text-3)", background: "var(--bg-2)", border: "1px solid var(--border)", cursor: "pointer" }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Sélecteur de date (30 jours) avec contours rouges sur jours avec séances */}
      <DayPicker
        currentDate={currentDate}
        onSelect={(iso) => updateParams("date", iso)}
        count={30}
        activeDates={activeDates}
      />
    </div>
  );
}
