"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import FilmCard from "@/components/FilmCard";
import { Film, CatalogSort, CatalogResult } from "@/lib/api";

// ── Config ────────────────────────────────────────────────

const PAGE_SIZE = 48;
const DEBOUNCE_MS = 350;
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: "seances",    label: "À l'affiche d'abord" },
  { value: "titre",      label: "Titre A → Z" },
  { value: "annee_desc", label: "Plus récent" },
  { value: "annee_asc",  label: "Plus ancien" },
];

const GENRES = [
  "Action", "Animation", "Aventure", "Comédie", "Crime", "Drame",
  "Famille", "Fantastique", "Guerre", "Histoire", "Horreur", "Musique",
  "Mystère", "Romance", "Science-Fiction", "Thriller", "Western",
];

const DECENNIES: { value: string; label: string }[] = [
  { value: "",    label: "Toutes les époques" },
  { value: "2020", label: "2020s" },
  { value: "2010", label: "2010s" },
  { value: "2000", label: "2000s" },
  { value: "1990", label: "1990s" },
  { value: "1980", label: "1980s" },
  { value: "1970", label: "1970s" },
  { value: "1900", label: "Avant 1970" },
];

// ── Fetch catalog depuis l'API ────────────────────────────

async function fetchCatalog(params: {
  q: string;
  genre: string;
  decennie: string;
  sort: CatalogSort;
  page: number;
  limit: number;
}): Promise<CatalogResult> {
  const qs = new URLSearchParams();
  if (params.q)        qs.set("q", params.q);
  if (params.genre)    qs.set("genre", params.genre);
  if (params.decennie) qs.set("decennie", params.decennie);
  qs.set("sort", params.sort);
  qs.set("page", String(params.page));
  qs.set("limit", String(params.limit));

  const res = await fetch(`${API}/api/films?${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// ── Composant ─────────────────────────────────────────────

const SCROLL_KEY  = "films_scrollY";
const STATE_KEY   = "films_state";

export default function FilmCatalog() {
  // Filtres
  const [query, setQuery]       = useState("");
  const [sort, setSort]         = useState<CatalogSort>("seances");
  const [genre, setGenre]       = useState("");
  const [decennie, setDecennie] = useState("");

  // Données
  const [films, setFilms]             = useState<Film[]>([]);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState(false);

  // Scroll restoration
  const scrollRestored = useRef(false);

  // Debounce ref pour la recherche
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeQuery = useRef(query);

  // Sentinel pour l'infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ── Chargement de la première page (ou reset) ──────────
  const loadPage1 = useCallback(async (q: string, g: string, d: string, s: CatalogSort) => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchCatalog({ q, genre: g, decennie: d, sort: s, page: 1, limit: PAGE_SIZE });
      setFilms(data.films);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement initial — restaure l'état si on revient de la page d'un film
  useEffect(() => {
    const saved = sessionStorage.getItem(STATE_KEY);
    if (saved) {
      try {
        const s = JSON.parse(saved) as {
          films: Film[]; total: number; totalPages: number; page: number;
          query: string; genre: string; decennie: string; sort: CatalogSort;
        };
        sessionStorage.removeItem(STATE_KEY);
        setFilms(s.films);
        setTotal(s.total);
        setTotalPages(s.totalPages);
        setPage(s.page);
        setQuery(s.query);
        setGenre(s.genre);
        setDecennie(s.decennie);
        setSort(s.sort);
        setLoading(false);
        return; // pas de fetch
      } catch { /* état corrompu → fetch normal */ }
    }
    loadPage1("", "", "", "seances");
  }, [loadPage1]);

  // Restaure la position de scroll après chargement
  useEffect(() => {
    if (!loading && !scrollRestored.current) {
      scrollRestored.current = true;
      const y = sessionStorage.getItem(SCROLL_KEY);
      if (y) {
        sessionStorage.removeItem(SCROLL_KEY);
        requestAnimationFrame(() => window.scrollTo({ top: parseInt(y), behavior: "instant" }));
      }
    }
  }, [loading]);

  // ── Handlers filtres (avec debounce sur la recherche) ──
  const handleQuery = (val: string) => {
    setQuery(val);
    activeQuery.current = val;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadPage1(val, genre, decennie, sort);
    }, DEBOUNCE_MS);
  };

  const handleSort = (val: CatalogSort) => {
    setSort(val);
    loadPage1(query, genre, decennie, val);
  };

  const handleGenre = (val: string) => {
    setGenre(val);
    loadPage1(query, val, decennie, sort);
  };

  const handleDecennie = (val: string) => {
    setDecennie(val);
    loadPage1(query, genre, val, sort);
  };

  const resetFilters = () => {
    setQuery(""); setGenre(""); setDecennie(""); setSort("seances");
    loadPage1("", "", "", "seances");
  };

  // ── Infinite scroll via IntersectionObserver ───────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMore && !loading && page < totalPages) {
          loadMore();
        }
      },
      { rootMargin: "300px" } // déclenche 300px avant que le sentinel soit visible
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, loading, page, totalPages]);

  // ── Voir plus ─────────────────────────────────────────
  const loadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const data = await fetchCatalog({ q: query, genre, decennie, sort, page: nextPage, limit: PAGE_SIZE });
      setFilms((prev) => [...prev, ...data.films]);
      setPage(nextPage);
    } catch { /* silencieux */ }
    finally { setLoadingMore(false); }
  };

  // Sauvegarde l'état courant (appelé au clic sur un film)
  const saveState = useCallback(() => {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    sessionStorage.setItem(STATE_KEY, JSON.stringify({
      films, total, totalPages, page, query, genre, decennie, sort,
    }));
  }, [films, total, totalPages, page, query, genre, decennie, sort]);

  // ── Vue "en salle" vs catalogue ───────────────────────
  const isDefaultView = !query && !genre && !decennie && sort === "seances";
  const enSalle = isDefaultView ? films.filter((f) => (f.seancesCount ?? 0) > 0) : [];
  const catalogue = isDefaultView ? films.filter((f) => (f.seancesCount ?? 0) === 0) : films;
  const isFiltered = !!(query || genre || decennie);

  return (
    <div className="px-6 py-10 mx-auto" style={{ maxWidth: 1200 }}>
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold mb-1" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
          Catalogue films
        </h1>
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          {loading ? "Chargement…" : `${total.toLocaleString("fr-FR")} films — actuels et classiques`}
        </p>
      </div>

      {/* ── Barre de filtres ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 mb-8">
        {/* Recherche : pleine largeur sur mobile, flex-1 sur desktop */}
        <div className="relative w-full sm:flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: "var(--text-3)" }}>
            🔍
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => handleQuery(e.target.value)}
            placeholder="Titre, réalisateur, acteur…"
            className="w-full rounded-lg text-sm pl-9 pr-3 py-2 outline-none"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
          {query && (
            <button onClick={() => handleQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--text-3)" }}>
              ✕
            </button>
          )}
        </div>

        {/* Tri + Genre + Décennie + Reset sur une seule ligne sur mobile */}
        <div className="flex gap-2 sm:contents">
          {/* Tri */}
          <select value={sort} onChange={(e) => handleSort(e.target.value as CatalogSort)}
            className="flex-1 sm:flex-none rounded-lg text-sm px-2 sm:px-3 py-2 outline-none min-w-0"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text)" }}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Genre */}
          <select value={genre} onChange={(e) => handleGenre(e.target.value)}
            className="flex-1 sm:flex-none rounded-lg text-sm px-2 sm:px-3 py-2 outline-none min-w-0"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text)" }}>
            <option value="">Tous les genres</option>
            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>

          {/* Décennie */}
          <select value={decennie} onChange={(e) => handleDecennie(e.target.value)}
            className="flex-1 sm:flex-none rounded-lg text-sm px-2 sm:px-3 py-2 outline-none min-w-0"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text)" }}>
            {DECENNIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>

          {/* Reset */}
          {isFiltered && (
            <button onClick={resetFilters} className="flex-none rounded-lg text-sm px-2 sm:px-3 py-2"
              style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Résultats ─────────────────────────────────── */}
      {loading ? (
        <div className="grid film-grid-catalog">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="rounded-xl animate-pulse" style={{ aspectRatio: "2/3", background: "var(--bg-2)" }} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="font-semibold mb-2" style={{ color: "var(--text)" }}>Erreur de chargement</p>
          <button onClick={() => loadPage1(query, genre, decennie, sort)}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--red)" }}>
            Réessayer
          </button>
        </div>
      ) : films.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🎬</p>
          <p className="font-semibold mb-2" style={{ color: "var(--text)" }}>Aucun film trouvé</p>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>Essayez un autre titre ou réinitialisez les filtres.</p>
        </div>
      ) : (
        <>
          {/* ── Vue par défaut : En salle + Catalogue ── */}
          {isDefaultView ? (
            <>
              {enSalle.length > 0 && (
                <div className="mb-10">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--red)" }}>
                    À l&apos;affiche en ce moment — {enSalle.length} film{enSalle.length > 1 ? "s" : ""}
                  </p>
                  <div className="grid film-grid-catalog"
                    onClick={saveState}>
                    {enSalle.map((film) => <FilmCard key={film.id} film={film} />)}
                  </div>
                </div>
              )}

              {catalogue.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)" }}>
                    Catalogue — {(total - enSalle.length).toLocaleString("fr-FR")} films
                  </p>
                  <div className="grid film-grid-catalog"
                    onClick={saveState}>
                    {catalogue.map((film) => <FilmCard key={film.id} film={film} />)}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ── Vue filtrée ── */
            <>
              <p className="text-xs mb-5" style={{ color: "var(--text-3)" }}>
                {total.toLocaleString("fr-FR")} film{total > 1 ? "s" : ""} {isFiltered ? "trouvé" + (total > 1 ? "s" : "") : ""}
                {films.length < total ? ` — ${films.length} affichés` : ""}
              </p>
              <div className="grid film-grid-catalog"
                onClick={saveState}>
                {films.map((film) => <FilmCard key={film.id} film={film} />)}
              </div>
            </>
          )}

          {/* ── Infinite scroll sentinel ───────────────── */}
          <div ref={sentinelRef} style={{ height: 1 }} />
          {loadingMore && (
            <div className="flex justify-center mt-8 gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-full animate-pulse"
                  style={{
                    width: 8, height: 8,
                    background: "var(--red)",
                    opacity: 0.6,
                    animationDelay: `${i * 150}ms`,
                  }}
                />
              ))}
            </div>
          )}
          {page >= totalPages && films.length > 0 && (
            <p className="text-center text-xs mt-8" style={{ color: "var(--text-3)" }}>
              {total.toLocaleString("fr-FR")} film{total > 1 ? "s" : ""} affichés
            </p>
          )}
        </>
      )}
    </div>
  );
}
