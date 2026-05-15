"use client";

import { useState, useMemo } from "react";
import { SeancesParCinema } from "@/lib/api";
import { SeanceGroupByCinema } from "./SeanceGroup";

interface Props {
  seancesParCinema: SeancesParCinema[];
  filmId: string;
  filmTitre: string;
}

export default function SeancesListWithSearch({ seancesParCinema, filmId, filmTitre }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return seancesParCinema;
    return seancesParCinema.filter(
      (g) =>
        g.cinema.nom.toLowerCase().includes(q) ||
        g.cinema.ville?.toLowerCase().includes(q)
    );
  }, [seancesParCinema, search]);

  return (
    <>
      {seancesParCinema.length > 1 && (
        <div className="relative mb-4">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
            style={{ color: "var(--text-3)" }}
          >
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Rechercher parmi ${seancesParCinema.length} cinémas…`}
            className="w-full rounded-lg text-sm pl-9 pr-3 py-2 outline-none"
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: "var(--text-3)" }}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: "var(--text-3)" }}>
          Aucun cinéma ne correspond à &ldquo;{search}&rdquo;
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((groupe) => (
            <SeanceGroupByCinema
              key={groupe.cinema.id}
              groupe={groupe}
              filmId={filmId}
              filmTitre={filmTitre}
            />
          ))}
        </div>
      )}
    </>
  );
}
