"use client";

import Link from "next/link";
import { Film, formatDuree } from "@/lib/api";
import FilmPoster from "./FilmPoster";

export default function FilmCard({ film }: { film: Film }) {
  return (
    <Link href={`/films/${film.id}`} className="no-underline">
      <div className="card cursor-pointer" style={{ borderRadius: 10, overflow: "hidden" }}>
        {/* Affiche */}
        <div className="relative w-full poster-container" style={{ aspectRatio: "2/3", background: "var(--bg-3)" }}>
          <FilmPoster
            src={film.affiche}
            alt={film.titre}
            fill
            sizes="(max-width: 640px) 50vw, 200px"
          />
        </div>

        {/* Infos */}
        <div className="p-3 film-card-info">
          <p className="film-card-title font-bold text-sm leading-snug mb-1" style={{ color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
            {film.titre}
          </p>
          <p className="film-card-meta text-xs" style={{ color: "var(--text-3)" }}>
            {[film.realisateur, film.annee, film.duree ? formatDuree(film.duree) : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="film-card-tags flex flex-wrap items-center gap-1 mt-1">
            {film.genres?.length > 0 && (
              <span
                className="px-1.5 py-0.5 rounded text-xs"
                style={{ background: "var(--bg-3)", color: "var(--text-2)" }}
              >
                {film.genres[0]}
              </span>
            )}
            {film.imdbNote != null ? (
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={{ background: "#f5c518", color: "#000", letterSpacing: "0.01em" }}
              >
                IMDb {film.imdbNote.toFixed(1)}
              </span>
            ) : film.tmdbNote != null && film.tmdbNote >= 7.0 ? (
              <span className="text-xs font-semibold" style={{ color: "var(--text-3)" }}>
                ★ {film.tmdbNote.toFixed(1)}
              </span>
            ) : null}
          </div>
          {(film.seancesCount ?? 0) > 0 && (
            <span className="badge-red mt-2 inline-block">
              {film.seancesCount} séance{(film.seancesCount ?? 0) > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
