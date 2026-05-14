import SearchBar from "@/components/SearchBar";
import FilmCard from "@/components/FilmCard";
import CinemaCard from "@/components/CinemaCard";
import CommentCaMarche from "@/components/CommentCaMarche";
import CinemasProches from "@/components/CinemasProches";
import FilmsLocaux from "@/components/FilmsLocaux";
import Image from "next/image";
import { api, Film } from "@/lib/api";

export const revalidate = 86400; // re-génère une fois par jour

/**
 * Trie les classiques par popularité IMDb décroissante et retourne les `count` premiers.
 * Score = note × log10(votes + 10) — équilibre qualité et notoriété.
 * Ex : Le Parrain (9.2 × 6.28 ≈ 58) >> film méconnu (6.0 × 3.0 ≈ 18).
 */
function popularityScore(film: Film): number {
  const note  = film.imdbNote  ?? film.tmdbNote ?? 0;
  const votes = film.imdbVotes ?? 0;
  return note * Math.log10(votes + 10);
}

function pickTopClassics(films: Film[], count = 6): Film[] {
  return [...films].sort((a, b) => popularityScore(b) - popularityScore(a)).slice(0, count);
}

/**
 * Film du jour : rotation déterministe basée sur le numéro du jour.
 * Même film toute la journée, change automatiquement à minuit.
 * Sélection parmi les films avec le plus de séances + bonne note.
 */
function pickFilmDuJour(trending: Film[]): Film | null {
  if (!trending.length) return null;
  // Trier par séances desc, puis note desc → liste stable
  const sorted = [...trending].sort((a, b) => {
    const seanceDiff = (b.seancesCount ?? 0) - (a.seancesCount ?? 0);
    if (seanceDiff !== 0) return seanceDiff;
    return (b.imdbNote ?? b.tmdbNote ?? 0) - (a.imdbNote ?? a.tmdbNote ?? 0);
  });
  // Indice déterministe : nb de jours depuis l'epoch Unix
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return sorted[dayIndex % sorted.length];
}

async function getHomeData() {
  try {
    const [trending, allClassics, cinemas, stats] = await Promise.all([
      api.getTrendingFilms().catch(() => [] as Film[]),
      api.getClassicFilms().catch(() => [] as Film[]),
      api.getCinemas("Paris").catch(() => []),
      api.getStats().catch(() => ({ films: 0, cinemas: 0, seances: 0 })),
    ]);

    const filmDuJour = pickFilmDuJour(trending);

    return {
      trending: trending.slice(0, 6),
      classics: pickTopClassics(allClassics, 6),
      cinemas: cinemas.slice(0, 4),
      totalFilms: stats.films,
      totalCinemas: stats.cinemas,
      totalSeances: stats.seances,
      filmDuJour,
    };
  } catch {
    return { trending: [], classics: [], cinemas: [], totalFilms: 0, totalCinemas: 0, totalSeances: 0, filmDuJour: null };
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cineradar.fr";

export default async function HomePage() {
  const { trending, classics, cinemas, totalFilms, totalCinemas, totalSeances, filmDuJour } = await getHomeData();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CinéRadar",
    url: SITE_URL,
    description: "Trouvez les séances de cinéma près de chez vous : UGC, Pathé, MK2 et cinémas indépendants.",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/recherche?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section
        className="px-6 py-20 text-center"
        style={{
          background: "linear-gradient(180deg, var(--bg-2) 0%, var(--bg) 100%)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: 640 }}>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "var(--red)" }}
          >
            Tous les cinémas français
          </p>
          <h1
            className="text-4xl font-extrabold mb-4"
            style={{ color: "var(--text)", letterSpacing: "-0.03em", lineHeight: 1.15 }}
          >
            Trouvez vos séances,<br />
            <span style={{ color: "var(--red)" }}>où que vous soyez</span>
          </h1>
          <p className="text-base mb-8" style={{ color: "var(--text-2)", lineHeight: 1.6 }}>
            UGC, Pathé, MK2, cinémas indépendants — tout en un seul endroit.
            Recherchez par film ou par cinéma, et créez des alertes pour vos reprises préférées.
          </p>
          <SearchBar large />
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-10" style={{ borderBottom: "1px solid var(--border)" }}>
        <div
          className="mx-auto grid grid-cols-3 gap-4 text-center"
          style={{ maxWidth: 480 }}
        >
          {[
            { value: totalFilms   > 0 ? `${totalFilms}`   : "—", label: "Films" },
            { value: totalCinemas > 0 ? `${totalCinemas}` : "—", label: "Cinémas" },
            { value: totalSeances > 0 ? `${totalSeances}` : "—", label: "Séances" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-extrabold" style={{ color: "var(--red)" }}>
                {s.value}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="px-6 py-10 mx-auto" style={{ maxWidth: 1100 }}>

        {/* ── Film du jour ── */}
        {filmDuJour && filmDuJour.affiche && (
          <section className="mb-14">
            <div
              className="relative overflow-hidden rounded-2xl flex flex-col sm:flex-row gap-0"
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                minHeight: 220,
              }}
            >
              {/* Poster flou en arrière-plan (effet cinéma) */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 0 }}
              >
                <Image
                  src={filmDuJour.affiche}
                  alt=""
                  fill
                  sizes="1100px"
                  style={{ objectFit: "cover", objectPosition: "center top", filter: "blur(32px) brightness(0.25)", transform: "scale(1.1)" }}
                  unoptimized
                  aria-hidden
                />
              </div>

              {/* Poster net */}
              <div
                className="relative flex-shrink-0"
                style={{ width: 140, minHeight: 210, position: "relative", zIndex: 1 }}
              >
                <Image
                  src={filmDuJour.affiche}
                  alt={filmDuJour.titre}
                  fill
                  sizes="140px"
                  style={{ objectFit: "cover", objectPosition: "center top" }}
                  unoptimized
                />
              </div>

              {/* Contenu */}
              <div
                className="relative flex flex-col justify-between px-6 py-5 flex-1"
                style={{ zIndex: 1 }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{ background: "var(--red)", color: "white" }}
                    >
                      🎬 Film du jour
                    </span>
                    {filmDuJour.seancesCount != null && filmDuJour.seancesCount > 0 && (
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                        {filmDuJour.seancesCount} séance{filmDuJour.seancesCount > 1 ? "s" : ""} aujourd&apos;hui
                      </span>
                    )}
                  </div>
                  <h2
                    className="text-2xl font-extrabold mb-1 leading-tight"
                    style={{ color: "white", letterSpacing: "-0.02em" }}
                  >
                    {filmDuJour.titre}
                  </h2>
                  {filmDuJour.realisateur && (
                    <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                      de {filmDuJour.realisateur}
                      {filmDuJour.annee ? ` · ${filmDuJour.annee}` : ""}
                    </p>
                  )}
                  {filmDuJour.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {filmDuJour.genres.slice(0, 3).map(g => (
                        <span
                          key={g}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                  {filmDuJour.synopsis && (
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        color: "rgba(255,255,255,0.7)",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {filmDuJour.synopsis}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <a
                    href={`/films/${filmDuJour.id}`}
                    className="text-sm font-bold px-5 py-2 rounded-xl text-white no-underline"
                    style={{ background: "var(--red)", display: "inline-block" }}
                  >
                    Voir les séances →
                  </a>
                  {(filmDuJour.imdbNote ?? filmDuJour.tmdbNote) && (
                    <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.65)" }}>
                      ⭐ {(filmDuJour.imdbNote ?? filmDuJour.tmdbNote)?.toFixed(1)}/10
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Films locaux personnalisés (localStorage city) */}
        <FilmsLocaux />

        {/* Nouveautés au cinéma */}
        {trending.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-extrabold" style={{ color: "var(--text)" }}>
                  Les nouveautés à l&apos;affiche
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                  Les dernières sorties dans vos cinémas
                </p>
              </div>
              <a
                href="/films"
                className="text-sm font-medium no-underline"
                style={{ color: "var(--red)" }}
              >
                Voir tout →
              </a>
            </div>
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))" }}
            >
              {trending.map((film) => (
                <FilmCard key={film.id} film={film} />
              ))}
            </div>
          </section>
        )}

        {/* À redécouvrir en salle */}
        {classics.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-extrabold" style={{ color: "var(--text)" }}>
                  À redécouvrir en salle
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                  Grands classiques du cinéma — liste renouvelée chaque semaine
                </p>
              </div>
              <a
                href="/films/classiques"
                className="text-sm font-medium no-underline"
                style={{ color: "var(--red)" }}
              >
                Voir tout →
              </a>
            </div>
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))" }}
            >
              {classics.map((film) => (
                <FilmCard key={film.id} film={film} />
              ))}
            </div>
          </section>
        )}

        {/* Cinémas populaires */}
        {cinemas.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-extrabold" style={{ color: "var(--text)" }}>
                Cinémas populaires
              </h2>
              <a
                href="/recherche?type=cinemas"
                className="text-sm font-medium no-underline"
                style={{ color: "var(--red)" }}
              >
                Voir tout →
              </a>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {cinemas.map((cinema) => (
                <CinemaCard key={cinema.id} cinema={cinema} />
              ))}
            </div>
          </section>
        )}

        {/* Cinémas près de moi (géolocalisation) */}
        <CinemasProches />

        {/* Comment ça marche */}
        <CommentCaMarche />

        {/* Fonctionnalités */}
        <section>
          <h2
            className="text-xl font-extrabold mb-6 text-center"
            style={{ color: "var(--text)" }}
          >
            Pourquoi CinéRadar ?
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: "🔍",
                titre: "Recherche universelle",
                desc: "Un seul endroit pour trouver les séances de tous les cinémas, des grandes chaînes aux salles indépendantes.",
              },
              {
                icon: "🔔",
                titre: "Alertes par email",
                desc: "Recevez un email dès qu'un film que vous attendez est programmé près de chez vous.",
              },
              {
                icon: "🎞️",
                titre: "Reprises et classiques",
                desc: "Les cinémas indépendants passent souvent des films classiques ou en reprise — ne les ratez plus.",
              },
            ].map((f) => (
              <div
                key={f.titre}
                className="card p-5 text-center"
                style={{ borderRadius: 10 }}
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <p className="font-bold text-sm mb-2" style={{ color: "var(--text)" }}>
                  {f.titre}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
