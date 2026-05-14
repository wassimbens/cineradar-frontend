import type { Metadata } from "next";
import SearchBar from "@/components/SearchBar";
import FilmCard from "@/components/FilmCard";
import CinemaCard from "@/components/CinemaCard";
import { api } from "@/lib/api";

interface Props {
  searchParams: Promise<{ q?: string; type?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q = "", type } = await searchParams;
  if (type === "films") return { title: "Tous les films — CinéRadar" };
  if (type === "cinemas") return { title: "Tous les cinémas — CinéRadar" };
  if (q) return { title: `"${q}" — Recherche CinéRadar` };
  return { title: "Recherche — CinéRadar" };
}

export default async function RecherchePage({ searchParams }: Props) {
  const { q = "", type } = await searchParams;
  const query = q.trim();

  let films: Awaited<ReturnType<typeof api.searchFilms>> = [];
  let cinemas: Awaited<ReturnType<typeof api.getCinemas>> = [];

  if (type === "films") {
    // Onglet Films : afficher tous les films
    films = await api.searchFilms("").catch(() => []);
  } else if (type === "cinemas") {
    // Onglet Cinémas : afficher tous les cinémas
    cinemas = await api.getCinemas("").catch(() => []);
  } else if (query) {
    // Recherche textuelle
    const results = await api.search(query).catch(() => ({ films: [], cinemas: [], total: 0 }));
    films = results.films;
    cinemas = results.cinemas;
  }

  const total = films.length + cinemas.length;
  const titre = type === "films" ? "Tous les films" : type === "cinemas" ? "Tous les cinémas" : null;

  return (
    <div className="px-6 py-10 mx-auto" style={{ maxWidth: 1100 }}>
      {/* Barre de recherche */}
      <div className="mb-6" style={{ maxWidth: 600 }}>
        <SearchBar defaultValue={query} />
      </div>

      {/* Onglets Films / Cinémas */}
      <div className="flex gap-2 mb-8">
        {[
          { label: "Tous les films", href: "/recherche?type=films", active: type === "films" },
          { label: "Tous les cinémas", href: "/recherche?type=cinemas", active: type === "cinemas" },
        ].map((tab) => (
          <a
            key={tab.href}
            href={tab.href}
            className="no-underline px-4 py-2 rounded-full text-sm font-medium transition-colors"
            style={{
              background: tab.active ? "var(--red)" : "var(--bg-2)",
              color: tab.active ? "#fff" : "var(--text-2)",
              border: "1px solid",
              borderColor: tab.active ? "var(--red)" : "var(--border)",
            }}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {titre ? (
        <>
          <h2 className="text-lg font-extrabold mb-6" style={{ color: "var(--text)" }}>
            {titre}{" "}
            <span className="text-sm font-normal" style={{ color: "var(--text-3)" }}>
              ({total})
            </span>
          </h2>

          {/* Films */}
          {films.length > 0 && (
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}
            >
              {films.map((film) => (
                <FilmCard key={film.id} film={film} />
              ))}
            </div>
          )}

          {/* Cinémas */}
          {cinemas.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cinemas.map((cinema) => (
                <CinemaCard key={cinema.id} cinema={cinema} />
              ))}
            </div>
          )}

          {total === 0 && (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">🎬</p>
              <p className="font-semibold" style={{ color: "var(--text-2)" }}>
                Aucun résultat — la base de données est peut-être vide.
              </p>
            </div>
          )}
        </>
      ) : query ? (
        <>
          <p className="text-sm mb-6" style={{ color: "var(--text-3)" }}>
            {total} résultat{total !== 1 ? "s" : ""} pour{" "}
            <strong style={{ color: "var(--text)" }}>&laquo;{query}&raquo;</strong>
          </p>

          {films.length > 0 && (
            <section className="mb-12">
              <h2 className="text-lg font-extrabold mb-4" style={{ color: "var(--text)" }}>
                Films ({films.length})
              </h2>
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}
              >
                {films.map((film) => (
                  <FilmCard key={film.id} film={film} />
                ))}
              </div>
            </section>
          )}

          {cinemas.length > 0 && (
            <section>
              <h2 className="text-lg font-extrabold mb-4" style={{ color: "var(--text)" }}>
                Cinémas ({cinemas.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cinemas.map((cinema) => (
                  <CinemaCard key={cinema.id} cinema={cinema} />
                ))}
              </div>
            </section>
          )}

          {total === 0 && (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">🎬</p>
              <p className="font-semibold mb-2" style={{ color: "var(--text)" }}>
                Aucun résultat
              </p>
              <p className="text-sm" style={{ color: "var(--text-3)" }}>
                Essayez un autre titre ou le nom d&apos;un cinéma.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-semibold" style={{ color: "var(--text-2)" }}>
            Tapez un film, un réalisateur ou un cinéma
          </p>
        </div>
      )}
    </div>
  );
}
