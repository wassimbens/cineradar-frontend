"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Film, formatDuree } from "@/lib/api";
import FilmPoster from "@/components/FilmPoster";

// ── Helpers ───────────────────────────────────────────────

function getDecennie(annee: number | null): string {
  if (!annee) return "Inconnue";
  if (annee < 1930) return "Avant 1930";
  if (annee < 1940) return "Années 1930";
  if (annee < 1950) return "Années 1940";
  if (annee < 1960) return "Années 1950";
  if (annee < 1970) return "Années 1960";
  if (annee < 1980) return "Années 1970";
  if (annee < 1990) return "Années 1980";
  if (annee < 2000) return "Années 1990";
  if (annee < 2010) return "Années 2000";
  if (annee < 2020) return "Années 2010";
  return "Années 2020";
}

const DECENNIE_ORDER = [
  "Années 2020", "Années 2010", "Années 2000", "Années 1990",
  "Années 1980", "Années 1970", "Années 1960", "Années 1950",
  "Années 1940", "Années 1930", "Avant 1930", "Inconnue",
];

type ViewMode = "decennie" | "realisateur" | "genre";

// ── Composant carte ───────────────────────────────────────

function ClassiqueCard({ film }: { film: Film }) {
  return (
    <Link href={`/films/${film.id}`} className="no-underline">
      <div
        className="group flex gap-3 p-3 rounded-xl transition-colors cursor-pointer"
        style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--red)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
      >
        <div
          className="relative flex-shrink-0 rounded-lg overflow-hidden"
          style={{ width: 48, height: 72, background: "var(--bg-3)" }}
        >
          <FilmPoster src={film.affiche} alt={film.titre} fill sizes="48px" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug truncate" style={{ color: "var(--text)" }}>
            {film.titre}
          </p>
          {film.titreOriginal && film.titreOriginal !== film.titre && (
            <p className="text-xs truncate italic" style={{ color: "var(--text-3)" }}>
              {film.titreOriginal}
            </p>
          )}
          <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
            {[film.annee, film.duree ? formatDuree(film.duree) : null].filter(Boolean).join(" · ")}
            {film.tmdbNote != null && film.tmdbNote >= 7.0 && (
              <span className="ml-2 font-semibold" style={{ color: "var(--text-3)" }}>
                ★ {film.tmdbNote.toFixed(1)}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {film.genres?.slice(0, 1).map((g) => (
              <span key={g} className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: "var(--bg-3)", color: "var(--text-2)" }}>
                {g}
              </span>
            ))}
            {(film.seancesCount ?? 0) > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold text-white"
                style={{ background: "var(--red)" }}>
                En séance
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Composant principal ───────────────────────────────────

export default function ClassiquesCatalog({ films }: { films: Film[] }) {
  // Décennie par défaut : meilleure vue d'ensemble avec 600+ films
  const [view, setView]         = useState<ViewMode>("decennie");
  const [query, setQuery]       = useState("");
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  // Filtrage
  const filtered = useMemo(() => {
    let list = films;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (f) =>
          f.titre.toLowerCase().includes(q) ||
          f.titreOriginal?.toLowerCase().includes(q) ||
          f.realisateur?.toLowerCase().includes(q) ||
          f.acteurs?.some((a) => a.toLowerCase().includes(q))
      );
    }
    return list;
  }, [films, query]);

  // Groupement
  const grouped = useMemo((): Map<string, Film[]> => {
    const map = new Map<string, Film[]>();

    for (const film of filtered) {
      let key = "";
      if (view === "decennie") {
        key = getDecennie(film.annee);
      } else if (view === "genre") {
        key = film.genres?.[0] || "Sans genre";
      } else {
        // Réalisateur : regrouper les réalisateurs avec 1 seul film dans "Autres"
        key = film.realisateur || "Réalisateur inconnu";
      }
      const arr = map.get(key) ?? [];
      arr.push(film);
      map.set(key, arr);
    }

    // En vue réalisateur : regrouper ceux avec 1 seul film
    if (view === "realisateur") {
      const AUTRES = "Autres réalisateurs";
      const autresFilms: Film[] = [];
      for (const [k, v] of map.entries()) {
        if (v.length === 1 && k !== "Réalisateur inconnu") {
          autresFilms.push(...v);
          map.delete(k);
        }
      }
      if (autresFilms.length > 0) {
        autresFilms.sort((a, b) => a.titre.localeCompare(b.titre, "fr"));
        map.set(AUTRES, autresFilms);
      }
    }

    // Tri des groupes
    const entries = Array.from(map.entries());
    if (view === "decennie") {
      entries.sort(([a], [b]) => DECENNIE_ORDER.indexOf(a) - DECENNIE_ORDER.indexOf(b));
    } else {
      const LAST = new Set(["Réalisateur inconnu", "Sans genre", "Autres réalisateurs"]);
      entries.sort(([a], [b]) => {
        if (LAST.has(a)) return 1;
        if (LAST.has(b)) return -1;
        // Trier les réalisateurs par nombre de films (desc)
        if (view === "realisateur") {
          const diff = (map.get(b)?.length ?? 0) - (map.get(a)?.length ?? 0);
          if (diff !== 0) return diff;
        }
        return a.localeCompare(b, "fr");
      });
    }

    return new Map(entries);
  }, [filtered, view]);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const expandAll  = () => setOpenGroups(new Set(grouped.keys()));
  const collapseAll = () => setOpenGroups(new Set());

  // Années extrêmes (guard contre tableau vide)
  const years = films.map((f) => f.annee).filter(Boolean) as number[];
  const minYear = years.length ? Math.min(...years) : null;
  const maxYear = years.length ? Math.max(...years) : null;

  const VIEW_TABS: { value: ViewMode; label: string; icon: string }[] = [
    { value: "decennie",    label: "Par époque",       icon: "📅" },
    { value: "realisateur", label: "Par réalisateur",  icon: "🎬" },
    { value: "genre",       label: "Par genre",         icon: "🎭" },
  ];

  return (
    <div className="px-6 py-10 mx-auto" style={{ maxWidth: 1200 }}>
      {/* En-tête */}
      <div className="mb-8">
        <Link href="/films" className="text-sm no-underline" style={{ color: "var(--text-3)" }}>
          ← Films
        </Link>
        <h1 className="text-2xl font-extrabold mt-2 mb-1" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
          Vos classiques
        </h1>
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          {films.length > 0
            ? `${films.length} films · ${minYear}–${maxYear}`
            : "Catalogue en cours de chargement…"}
        </p>
      </div>

      {/* Barre outils */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Recherche */}
        <div className="relative flex-1" style={{ minWidth: 220 }}>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-sm"
            style={{ color: "var(--text-3)" }}>🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Film, réalisateur, acteur…"
            className="w-full rounded-lg text-sm pl-9 pr-3 py-2 outline-none"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: "var(--text-3)" }}>✕</button>
          )}
        </div>

        {/* Tabs vue */}
        <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setView(tab.value);
                setOpenGroups(new Set()); // tout fermer lors d'un changement de vue
              }}
              className="px-3 py-2 text-sm transition-colors"
              style={{
                background: view === tab.value ? "var(--red)" : "var(--bg-2)",
                color: view === tab.value ? "white" : "var(--text-2)",
                border: "none",
                cursor: "pointer",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Expand / Collapse */}
        <div className="flex gap-2">
          <button onClick={expandAll} className="px-3 py-2 rounded-lg text-sm"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-2)", cursor: "pointer" }}>
            Tout ouvrir
          </button>
          <button onClick={collapseAll} className="px-3 py-2 rounded-lg text-sm"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-2)", cursor: "pointer" }}>
            Tout fermer
          </button>
        </div>
      </div>

      {/* Compteur */}
      <p className="text-xs mb-6" style={{ color: "var(--text-3)" }}>
        {filtered.length} film{filtered.length > 1 ? "s" : ""} · {grouped.size} groupe{grouped.size > 1 ? "s" : ""}
        {query && (
          <button onClick={() => { setQuery(""); }}
            className="ml-3 underline" style={{ color: "var(--red)", cursor: "pointer", background: "none", border: "none" }}>
            Effacer les filtres
          </button>
        )}
      </p>

      {/* Groupes accordéon */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">🎭</p>
          <p className="font-semibold" style={{ color: "var(--text)" }}>Aucun film trouvé</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Essayez un autre terme ou effacez les filtres</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from(grouped.entries()).map(([groupKey, groupFilms]) => {
            const isOpen = openGroups.has(groupKey);
            return (
              <div key={groupKey} className="rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--border)" }}>
                <button
                  onClick={() => toggleGroup(groupKey)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  style={{ background: "var(--bg-2)", border: "none", cursor: "pointer" }}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm" style={{ color: "var(--text)" }}>{groupKey}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "var(--bg-3)", color: "var(--text-3)" }}>
                      {groupFilms.length}
                    </span>
                    {/* Badge "En séance" si au moins un film en salle */}
                    {groupFilms.some((f) => (f.seancesCount ?? 0) > 0) && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white"
                        style={{ background: "var(--red)" }}>
                        En séance
                      </span>
                    )}
                  </div>
                  <span style={{ color: "var(--text-3)", fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
                </button>

                {isOpen && (
                  <div className="p-4 grid gap-3"
                    style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", background: "var(--bg)" }}>
                    {groupFilms
                      .sort((a, b) =>
                        view === "realisateur"
                          ? (a.annee ?? 9999) - (b.annee ?? 9999)
                          : a.titre.localeCompare(b.titre, "fr")
                      )
                      .map((film) => (
                        <ClassiqueCard key={film.id} film={film} />
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
