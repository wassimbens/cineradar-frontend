"use client";

/**
 * FilmsLocaux — Section "Films en salle près de chez toi"
 *
 * Lit la ville stockée dans localStorage (clé "cineradar_ville"),
 * fetch /api/films/trending?ville=... et affiche un carousel personnalisé.
 *
 * Si aucune ville n'est stockée, affiche un prompt discret pour inviter
 * l'utilisateur à sélectionner sa ville.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

const VILLES_POPULAIRES = [
  "Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux",
  "Nantes", "Lille", "Strasbourg", "Nice", "Rennes",
];

interface FilmLocal {
  id: string;
  titre: string;
  affiche: string | null;
  annee: number | null;
  genres: string[];
  realisateur: string | null;
  seancesCount?: number;
  imdbNote?: number | null;
  tmdbNote?: number | null;
}

function FilmMiniCard({ film }: { film: FilmLocal }) {
  return (
    <Link href={`/films/${film.id}`} className="no-underline flex-shrink-0" style={{ width: 130 }}>
      <div
        className="rounded-xl overflow-hidden"
        style={{ aspectRatio: "2/3", position: "relative", background: "var(--bg-3)", marginBottom: 8 }}
      >
        {film.affiche ? (
          <Image
            src={film.affiche}
            alt={film.titre}
            fill
            sizes="130px"
            style={{ objectFit: "cover", objectPosition: "center top" }}
            unoptimized
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "2rem" }}>
            🎬
          </div>
        )}
        {film.seancesCount != null && film.seancesCount > 0 && (
          <div
            style={{
              position: "absolute", bottom: 6, right: 6,
              background: "rgba(0,0,0,0.75)", color: "white",
              fontSize: "0.6rem", fontWeight: 700,
              padding: "2px 6px", borderRadius: 4,
            }}
          >
            {film.seancesCount} séances
          </div>
        )}
      </div>
      <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>
        {film.titre}
      </p>
      {film.annee && (
        <p className="text-xs" style={{ color: "var(--text-3)" }}>{film.annee}</p>
      )}
    </Link>
  );
}

export default function FilmsLocaux() {
  const [ville, setVille]           = useState<string | null>(null);
  const [films, setFilms]           = useState<FilmLocal[]>([]);
  const [loading, setLoading]       = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [mounted, setMounted]       = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("cineradar_ville");
    if (stored) setVille(stored);
  }, []);

  useEffect(() => {
    if (!ville) return;
    setLoading(true);
    fetch(`${API}/api/films/trending?ville=${encodeURIComponent(ville)}&limit=8`)
      .then(r => r.ok ? r.json() : [])
      .then((data: FilmLocal[]) => setFilms(Array.isArray(data) ? data : []))
      .catch(() => setFilms([]))
      .finally(() => setLoading(false));
  }, [ville]);

  const choisirVille = (v: string) => {
    localStorage.setItem("cineradar_ville", v);
    setVille(v);
    setShowPicker(false);
  };

  const effacerVille = () => {
    localStorage.removeItem("cineradar_ville");
    setVille(null);
    setFilms([]);
  };

  // SSR : ne rien afficher avant le montage (évite le flash localStorage)
  if (!mounted) return null;

  // Pas de ville configurée → invite discrète
  if (!ville) {
    return (
      <section className="mb-14">
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 rounded-2xl"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <div>
            <p className="font-bold text-sm" style={{ color: "var(--text)" }}>
              🏙️ Films en salle près de chez toi
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
              Choisissez votre ville pour voir les films actuellement à l&apos;affiche
            </p>
          </div>
          <button
            onClick={() => setShowPicker(true)}
            className="text-sm font-bold px-4 py-2 rounded-xl text-white flex-shrink-0"
            style={{ background: "var(--red)", cursor: "pointer", border: "none" }}
          >
            Choisir ma ville
          </button>
        </div>

        {showPicker && (
          <div
            className="mt-3 p-4 rounded-2xl"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
              Sélectionner une ville
            </p>
            <div className="flex flex-wrap gap-2">
              {VILLES_POPULAIRES.map(v => (
                <button
                  key={v}
                  onClick={() => choisirVille(v)}
                  className="text-sm px-3 py-1.5 rounded-lg"
                  style={{
                    background: "var(--bg-3)",
                    border: "1px solid var(--border)",
                    color: "var(--text-2)",
                    cursor: "pointer",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-extrabold" style={{ color: "var(--text)" }}>
            En salle à {ville}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            Films actuellement à l&apos;affiche dans ta ville
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPicker(v => !v)}
            className="text-xs px-2 py-1 rounded-lg"
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              color: "var(--text-3)",
              cursor: "pointer",
            }}
          >
            ✎ Changer
          </button>
          <Link
            href={`/films?ville=${encodeURIComponent(ville)}`}
            className="text-sm font-medium no-underline"
            style={{ color: "var(--red)" }}
          >
            Voir tout →
          </Link>
        </div>
      </div>

      {showPicker && (
        <div
          className="mb-4 p-3 rounded-xl"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <div className="flex flex-wrap gap-2">
            {VILLES_POPULAIRES.map(v => (
              <button
                key={v}
                onClick={() => choisirVille(v)}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{
                  background: v === ville ? "var(--red)" : "var(--bg-3)",
                  color: v === ville ? "white" : "var(--text-2)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  fontWeight: v === ville ? 700 : 400,
                }}
              >
                {v}
              </button>
            ))}
            <button
              onClick={effacerVille}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{
                background: "var(--bg-3)",
                border: "1px solid var(--border)",
                color: "var(--text-3)",
                cursor: "pointer",
              }}
            >
              ✕ Effacer
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 rounded-xl animate-pulse"
              style={{ width: 130, aspectRatio: "2/3", background: "var(--bg-2)" }}
            />
          ))}
        </div>
      ) : films.length === 0 ? (
        <div
          className="text-center py-10 rounded-2xl"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <p className="text-2xl mb-2">🎭</p>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            Aucun film trouvé à {ville} pour le moment.
          </p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {films.map(film => <FilmMiniCard key={film.id} film={film} />)}
        </div>
      )}
    </section>
  );
}
