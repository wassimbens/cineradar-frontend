"use client";

/**
 * CinemasProches — section "Cinémas près de moi"
 *
 * Affiche un bouton qui demande la géolocalisation du navigateur,
 * appelle /api/cinemas/nearby et affiche les résultats sous forme
 * de cards avec la distance en km.
 */

import { useState, useCallback } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

interface NearbyCinema {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  codePostal: string;
  chaine: string | null;
  distanceKm: number;
  seancesAujourdhui?: number;
}

type GeoStatus = "idle" | "loading" | "denied" | "done" | "error";

function CinemaRow({ cinema }: { cinema: NearbyCinema }) {
  const dist = cinema.distanceKm < 1
    ? `${Math.round(cinema.distanceKm * 1000)} m`
    : `${cinema.distanceKm.toFixed(1)} km`;

  return (
    <Link
      href={`/cinemas/${cinema.id}`}
      className="no-underline"
      style={{ display: "block" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl"
        style={{
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
          transition: "border-color 0.15s",
          cursor: "pointer",
        }}
      >
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>
            {cinema.nom}
          </p>
          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-3)" }}>
            {cinema.adresse}, {cinema.ville}
            {cinema.seancesAujourdhui != null && cinema.seancesAujourdhui > 0
              ? ` · ${cinema.seancesAujourdhui} séance${cinema.seancesAujourdhui > 1 ? "s" : ""} aujourd'hui`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "var(--red)", color: "white" }}
          >
            {dist}
          </span>
          <span style={{ color: "var(--text-3)", fontSize: "0.75rem" }}>→</span>
        </div>
      </div>
    </Link>
  );
}

export default function CinemasProches() {
  const [status, setStatus]   = useState<GeoStatus>("idle");
  const [cinemas, setCinemas] = useState<NearbyCinema[]>([]);
  const [radius, setRadius]   = useState(10);

  const locate = useCallback(async (r = radius) => {
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords;
          const res  = await fetch(`${API}/api/cinemas/nearby?lat=${lat}&lng=${lng}&radius=${r}&limit=8`);
          const data = await res.json() as NearbyCinema[];
          const nearby = Array.isArray(data) ? data : [];
          setCinemas(nearby);
          // Sauvegarder la ville du cinéma le plus proche pour FilmsLocaux
          if (nearby.length > 0 && !localStorage.getItem("cineradar_ville")) {
            localStorage.setItem("cineradar_ville", nearby[0].ville);
          }
          setStatus("done");
        } catch {
          setStatus("error");
        }
      },
      (err) => {
        setStatus(err.code === 1 ? "denied" : "error");
      },
      { timeout: 10_000, maximumAge: 60_000 }
    );
  }, [radius]);

  const changeRadius = (r: number) => {
    setRadius(r);
    if (status === "done") locate(r);
  };

  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-extrabold" style={{ color: "var(--text)" }}>
            Cinémas près de moi
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            Basé sur votre position GPS
          </p>
        </div>
        {status === "done" && (
          <div className="flex items-center gap-1">
            {[5, 10, 20].map(r => (
              <button
                key={r}
                onClick={() => changeRadius(r)}
                className="text-xs px-2 py-1 rounded-lg"
                style={{
                  background: radius === r ? "var(--red)" : "var(--bg-2)",
                  color: radius === r ? "white" : "var(--text-3)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                }}
              >
                {r} km
              </button>
            ))}
          </div>
        )}
      </div>

      {status === "idle" && (
        <div
          className="flex flex-col items-center justify-center gap-4 py-12 rounded-2xl text-center"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <span style={{ fontSize: "2.5rem" }}>📍</span>
          <div>
            <p className="font-bold text-sm mb-1" style={{ color: "var(--text)" }}>
              Trouvez les cinémas autour de vous
            </p>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>
              Activez la géolocalisation pour voir les salles à moins de {radius} km
            </p>
          </div>
          <button
            onClick={() => locate()}
            className="text-sm font-bold px-6 py-2.5 rounded-xl text-white"
            style={{ background: "var(--red)", cursor: "pointer" }}
          >
            📍 Me géolocaliser
          </button>
        </div>
      )}

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl animate-pulse"
              style={{ height: 62, background: "var(--bg-2)", border: "1px solid var(--border)" }}
            />
          ))}
        </div>
      )}

      {status === "denied" && (
        <div
          className="text-center py-10 rounded-2xl"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <p className="text-2xl mb-2">🔒</p>
          <p className="font-medium text-sm mb-1" style={{ color: "var(--text)" }}>
            Accès à la position refusé
          </p>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            Autorisez la géolocalisation dans les paramètres de votre navigateur.
          </p>
        </div>
      )}

      {status === "error" && (
        <div
          className="text-center py-10 rounded-2xl"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <p className="text-2xl mb-2">⚠️</p>
          <p className="font-medium text-sm mb-1" style={{ color: "var(--text)" }}>
            Impossible de récupérer votre position
          </p>
          <button
            onClick={() => locate()}
            className="text-xs px-4 py-2 rounded-lg mt-2"
            style={{ background: "var(--bg-3)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--text-2)" }}
          >
            Réessayer
          </button>
        </div>
      )}

      {status === "done" && cinemas.length === 0 && (
        <div
          className="text-center py-10 rounded-2xl"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <p className="text-2xl mb-2">🎭</p>
          <p className="font-medium text-sm mb-1" style={{ color: "var(--text)" }}>
            Aucun cinéma dans un rayon de {radius} km
          </p>
          <button
            onClick={() => changeRadius(radius + 10)}
            className="text-xs px-4 py-2 rounded-lg mt-2"
            style={{ background: "var(--red)", color: "white", cursor: "pointer", border: "none" }}
          >
            Élargir à {radius + 10} km
          </button>
        </div>
      )}

      {status === "done" && cinemas.length > 0 && (
        <div className="flex flex-col gap-2">
          {cinemas.map(c => <CinemaRow key={c.id} cinema={c} />)}
        </div>
      )}
    </section>
  );
}
