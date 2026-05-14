import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import FilmPoster from "@/components/FilmPoster";
import { api, formatDuree, SeancesParCinema } from "@/lib/api";
import { SeanceGroupByCinema } from "@/components/SeanceGroup";
import AlerteButton from "./AlerteButton";
import SynopsisCollapsible from "@/components/SynopsisCollapsible";
import SeancesFiltres from "@/components/SeancesFiltres";
import TrailerSection from "@/components/TrailerSection";
import ProfilActions from "@/components/ProfilActions";
import CommunityRating from "@/components/CommunityRating";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string; ville?: string; version?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const film = await api.getFilm(id);
    return {
      title: `${film.titre} — CinéRadar`,
      description: film.synopsis?.slice(0, 160) ??
        `Séances de ${film.titre}${film.annee ? ` (${film.annee})` : ""}${film.realisateur ? ` de ${film.realisateur}` : ""} dans tous les cinémas.`,
      openGraph: {
        title: `${film.titre} — CinéRadar`,
        description: film.synopsis?.slice(0, 160),
        images: film.affiche ? [film.affiche] : [],
        type: "article",
      },
    };
  } catch {
    return { title: "Film — CinéRadar" };
  }
}

// ── Section séances (composant async isolé dans Suspense) ──
// Séparé du reste pour que le film s'affiche immédiatement
// pendant que les séances chargent en streaming.

interface SeancesSectionProps {
  filmId: string;
  filmTitre: string;
  searchParams: Props["searchParams"];
}

async function SeancesSection({ filmId, filmTitre, searchParams }: SeancesSectionProps) {
  const filters = await searchParams;

  const seancesParCinema: SeancesParCinema[] = await api
    .getFilmSeances(filmId, {
      ville: filters.ville,
      date: filters.date,
      version: filters.version as "VO" | "VF" | "VOSTFR" | undefined,
    })
    .catch(() => []);

  const totalSeances = seancesParCinema.reduce((acc, g) => acc + g.seances.length, 0);

  const dateAffichee = filters.date
    ? new Date(filters.date + "T00:00:00").toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "aujourd\u2019hui";

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-extrabold" style={{ color: "var(--text)" }}>
          Séances
        </h2>
        {totalSeances > 0 && (
          <span
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{ background: "var(--bg-2)", color: "var(--text-3)", border: "1px solid var(--border)" }}
          >
            {totalSeances} séance{totalSeances > 1 ? "s" : ""}
            {filters.ville ? ` · ${filters.ville}` : ""}
          </span>
        )}
      </div>

      {/* Filtres : calendrier + ville (client component) */}
      <Suspense>
        <SeancesFiltres filmId={filmId} />
      </Suspense>

      {/* Résultats */}
      {seancesParCinema.length === 0 ? (
        <div
          className="text-center py-14 rounded-xl"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <p className="text-3xl mb-3">📭</p>
          <p className="font-medium mb-1" style={{ color: "var(--text)" }}>
            Aucune séance programmée {dateAffichee}
            {filters.ville ? ` à ${filters.ville}` : ""}
          </p>
          <p className="text-sm mb-5" style={{ color: "var(--text-3)" }}>
            Essayez une autre date ou une autre ville, ou créez une alerte.
          </p>
          <AlerteButton filmTitre={filmTitre} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {seancesParCinema.map((groupe) => (
            <SeanceGroupByCinema key={groupe.cinema.id} groupe={groupe} filmId={filmId} filmTitre={filmTitre} />
          ))}
        </div>
      )}
    </>
  );
}

// ── Skeleton affiché pendant le chargement des séances ─────

function SeancesSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-extrabold" style={{ color: "var(--text)" }}>
          Séances
        </h2>
      </div>
      {/* Calendrier placeholder */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 rounded-xl"
            style={{
              width: 68,
              height: 52,
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              opacity: 0.5,
            }}
          />
        ))}
      </div>
      {/* Cinéma placeholders */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="card p-4 mb-4 rounded-xl"
          style={{ height: 80, opacity: 0.4, background: "var(--bg-2)" }}
        />
      ))}
    </>
  );
}

// ── Page principale ────────────────────────────────────────

export default async function FilmPage({ params, searchParams }: Props) {
  const { id } = await params;

  let film;
  try {
    film = await api.getFilm(id);
  } catch {
    notFound();
  }

  // JSON-LD pour le SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: film.titre,
    alternateName: film.titreOriginal ?? undefined,
    description: film.synopsis ?? undefined,
    image: film.affiche ?? undefined,
    dateCreated: film.annee ? `${film.annee}` : undefined,
    duration: film.duree ? `PT${Math.floor(film.duree / 60)}H${film.duree % 60}M` : undefined,
    director: film.realisateur ? { "@type": "Person", name: film.realisateur } : undefined,
    actor: film.acteurs?.map((a) => ({ "@type": "Person", name: a })),
    genre: film.genres,
  };

  return (
    <div className="px-6 py-10 mx-auto" style={{ maxWidth: 900 }}>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Bouton retour */}
      <Link
        href="/films"
        className="inline-flex items-center gap-1 text-sm mb-8 no-underline"
        style={{ color: "var(--text-3)" }}
      >
        ← Tous les films
      </Link>

      {/* En-tête film — s'affiche immédiatement */}
      <div className="flex gap-8 mb-10 items-start">
        {/* Affiche — taille généreuse, pas de compression */}
        <div
          className="flex-shrink-0 rounded-2xl overflow-hidden shadow-xl poster-container"
          style={{
            width: "clamp(140px, 22vw, 220px)",
            aspectRatio: "2/3",
            background: "var(--bg-3)",
            position: "relative",
          }}
        >
          <FilmPoster
            src={film.affiche}
            alt={film.titre}
            fill
            sizes="(max-width: 600px) 140px, 220px"
            priority
          />
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          {film.genres?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {film.genres.map((g) => (
                <span
                  key={g}
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: "var(--bg-3)", color: "var(--text-2)", border: "1px solid var(--border)" }}
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          <h1
            className="text-3xl font-extrabold mb-1"
            style={{ color: "var(--text)", letterSpacing: "0.01em", lineHeight: 1.2, textTransform: "uppercase" }}
          >
            {film.titre}
          </h1>

          {film.titreOriginal && film.titreOriginal !== film.titre && (
            <p className="text-sm mb-3 italic" style={{ color: "var(--text-3)" }}>
              {film.titreOriginal}
            </p>
          )}

          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm mb-5" style={{ color: "var(--text-2)" }}>
            {film.realisateur && (
              <span className="flex items-center gap-1">
                <span style={{ color: "var(--text-3)" }}>Réal.</span>
                <Link
                  href={`/recherche?q=${encodeURIComponent(film.realisateur)}`}
                  className="no-underline"
                  style={{ color: "var(--red)", fontWeight: 700 }}
                >
                  {film.realisateur}
                </Link>
              </span>
            )}
            {film.annee && <span style={{ color: "var(--text-3)" }}>{film.annee}</span>}
            {film.duree && <span style={{ color: "var(--text-3)" }}>{formatDuree(film.duree)}</span>}
          </div>

          {/* Notes agrégées : IMDb + TMDB */}
          {(film.imdbNote != null || film.tmdbNote != null) && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {film.imdbNote != null && (
                <>
                  <a
                    href={film.imdbId ? `https://www.imdb.com/title/${film.imdbId}/` : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={film.imdbVotes != null ? `${film.imdbVotes.toLocaleString("fr-FR")} votes IMDb` : "IMDb"}
                    style={{ textDecoration: "none" }}
                  >
                    <span
                      className="text-sm font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1"
                      style={{ background: "#f5c518", color: "#000" }}
                    >
                      IMDb {film.imdbNote.toFixed(1)}
                      <span style={{ opacity: 0.6, fontWeight: 400, fontSize: "0.7rem" }}>/10</span>
                    </span>
                  </a>
                  {film.imdbVotes != null && (
                    <span className="text-xs" style={{ color: "var(--text-3)" }}>
                      {film.imdbVotes.toLocaleString("fr-FR")} votes
                    </span>
                  )}
                </>
              )}
              {film.tmdbNote != null && film.tmdbNote > 0 && (
                <a
                  href={`https://www.themoviedb.org/search?query=${encodeURIComponent(film.titre)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Note TMDB"
                  style={{ textDecoration: "none" }}
                >
                  <span
                    className="text-sm font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1"
                    style={{ background: "#01b4e4", color: "#fff" }}
                  >
                    TMDB {film.tmdbNote.toFixed(1)}
                    <span style={{ opacity: 0.8, fontWeight: 400, fontSize: "0.7rem" }}>/10</span>
                  </span>
                </a>
              )}
            </div>
          )}

          {film.acteurs?.length > 0 && (
            <p className="text-xs mb-4" style={{ color: "var(--text-3)" }}>
              Avec{" "}
              {film.acteurs.slice(0, 5).map((acteur, i) => (
                <span key={acteur}>
                  {i > 0 && <span style={{ color: "var(--text-3)" }}>, </span>}
                  <a
                    href={`/recherche?q=${encodeURIComponent(acteur)}`}
                    style={{ color: "var(--red)", textDecoration: "none" }}
                  >
                    {acteur}
                  </a>
                </span>
              ))}
              {film.acteurs.length > 5 && (
                <span style={{ color: "var(--text-3)" }}>
                  {" "}+ {film.acteurs.length - 5} autres
                </span>
              )}
            </p>
          )}

          {/* Note communauté CinéRadar */}
          <div className="mb-4">
            <CommunityRating filmId={id} />
          </div>

          {film.synopsis && <SynopsisCollapsible texte={film.synopsis} />}

          <div className="mt-5 flex flex-col gap-3">
            {/* Boutons alerte */}
            <Suspense fallback={
              <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white opacity-60"
                style={{ background: "var(--red)", border: "none" }}>
                🔔 Créer une alerte
              </button>
            }>
              <AlerteButton filmTitre={film.titre} />
            </Suspense>

            {/* Boutons profil : favori / watchlist / avis */}
            <ProfilActions filmId={id} filmTitre={film.titre} />
          </div>
        </div>
      </div>

      {/* Bande annonce — streamée indépendamment */}
      <Suspense fallback={null}>
        <TrailerSection filmId={id} filmTitre={film.titre} />
      </Suspense>

      {/* Séances — chargées en streaming, n'bloquent pas le rendu du film */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          paddingTop: "2rem",
          marginTop: "2rem",
        }}
      >
        <Suspense fallback={<SeancesSkeleton />}>
          <SeancesSection
            filmId={id}
            filmTitre={film.titre}
            searchParams={searchParams}
          />
        </Suspense>
      </div>
    </div>
  );
}
