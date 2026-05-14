"use client";

/**
 * PosterPicker — Sélecteur d'affiche personnalisée (membres Pro)
 *
 * Ouverture : long-press (500 ms) sur une affiche dans la page profil.
 * Affiche une grille de jusqu'à 12 affiches récupérées depuis TMDB.
 * Le choix est sauvegardé via PUT /api/profil/:email/poster-choice.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";

const API      = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY ?? "";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

interface Props {
  filmId: string;
  filmTitre: string;
  email: string;
  token: string;
  currentPoster: string | null;
  onClose: () => void;
  onSelect: (posterUrl: string) => void;
}

/** Récupère les affiches TMDB directement depuis le navigateur */
async function fetchTmdbPosters(tmdbId: number, key: string): Promise<string[]> {
  type TmdbImg   = { file_path: string; vote_average: number };
  type TmdbResp  = { posters?: TmdbImg[] };
  const BASE = "https://api.themoviedb.org/3";

  const [fr, en] = await Promise.all([
    fetch(`${BASE}/movie/${tmdbId}/images?api_key=${key}&include_image_language=fr,null`)
      .then(r => r.ok ? r.json() as Promise<TmdbResp> : { posters: [] }),
    fetch(`${BASE}/movie/${tmdbId}/images?api_key=${key}&include_image_language=en,null`)
      .then(r => r.ok ? r.json() as Promise<TmdbResp> : { posters: [] }),
  ]);

  const seen = new Set<string>();
  return [...((fr as TmdbResp).posters ?? []), ...((en as TmdbResp).posters ?? [])]
    .filter(p => { if (seen.has(p.file_path)) return false; seen.add(p.file_path); return true; })
    .sort((a, b) => b.vote_average - a.vote_average)
    .slice(0, 12)
    .map(p => `${TMDB_IMG}${p.file_path}`);
}

export default function PosterPicker({ filmId, filmTitre, email, token, currentPoster, onClose, onSelect }: Props) {
  const [posters, setPosters]     = useState<string[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState<string | null>(null);
  const [error, setError]         = useState("");
  const [selected, setSelected]   = useState<string | null>(currentPoster);
  const [preview, setPreview]     = useState<string | null>(null); // aperçu longpress
  const previewTimer              = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startPreview = (url: string) => {
    previewTimer.current = setTimeout(() => setPreview(url), 500);
  };
  const cancelPreview = () => {
    if (previewTimer.current) { clearTimeout(previewTimer.current); previewTimer.current = null; }
  };

  // Charger les affiches : d'abord récup le tmdbId via notre API, puis appelle TMDB depuis le browser
  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        // 1. Récupérer le tmdbId du film
        const filmData = await fetch(`${API}/api/films/${filmId}`)
          .then(r => r.ok ? r.json() : null) as { tmdbId?: number | string; affiche?: string } | null;

        const mainPoster = filmData?.affiche ?? currentPoster;
        const results: string[] = mainPoster ? [mainPoster] : [];

        // 2. Si tmdbId connu ET clé TMDB disponible → appeler TMDB directement depuis le browser
        if (filmData?.tmdbId && TMDB_KEY) {
          const tmdbPosters = await fetchTmdbPosters(Number(filmData.tmdbId), TMDB_KEY);
          for (const url of tmdbPosters) {
            if (!results.includes(url)) results.push(url);
          }
        }

        setPosters(results);
      } catch {
        // Fallback : affiche courante seulement
        if (currentPoster) setPosters([currentPoster]);
      } finally {
        setLoading(false);
      }
    })();
  }, [filmId, currentPoster]);

  // Fermer sur Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSelect = useCallback(async (posterUrl: string) => {
    setSaving(posterUrl);
    setError("");
    try {
      const res = await fetch(`${API}/api/profil/${encodeURIComponent(email)}/poster-choice`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ filmId, posterUrl }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Erreur de sauvegarde");
      }
      setSelected(posterUrl);
      onSelect(posterUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(null);
    }
  }, [email, filmId, token, onSelect]);

  const handleReset = useCallback(async () => {
    setSaving("reset");
    try {
      await fetch(`${API}/api/profil/${encodeURIComponent(email)}/poster-choice/${filmId}`, {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: "include",
      });
      setSelected(null);
      onSelect(posters[0] ?? "");
    } catch { /* silencieux */ }
    finally { setSaving(null); }
  }, [email, filmId, token, posters, onSelect]);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full rounded-2xl overflow-hidden"
        style={{
          maxWidth: 560,
          background: "var(--bg)",
          border: "1px solid var(--border)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* En-tête */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <p className="font-bold text-sm" style={{ color: "var(--text)" }}>
              Choisir une affiche
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-3)", maxWidth: 320 }}>
              {filmTitre}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Badge Pro */}
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: "var(--red)", color: "white" }}
            >
              ✦ Pro
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-sm"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-2)", cursor: "pointer" }}
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Corps : grille d'affiches */}
        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg animate-pulse"
                  style={{ aspectRatio: "2/3", background: "var(--bg-2)" }}
                />
              ))}
            </div>
          ) : posters.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-2xl mb-2">🎬</p>
              <p className="text-sm" style={{ color: "var(--text-3)" }}>
                Aucune affiche alternative disponible pour ce film.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs mb-3" style={{ color: "var(--text-3)" }}>
                {posters.length} affiche{posters.length > 1 ? "s" : ""} disponible{posters.length > 1 ? "s" : ""} — restez appuyé pour prévisualiser
              </p>
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                {posters.map((url) => {
                  const isSelected = url === selected;
                  const isSaving   = url === saving;
                  return (
                    <button
                      key={url}
                      onClick={() => handleSelect(url)}
                      onMouseDown={() => startPreview(url)}
                      onMouseUp={cancelPreview}
                      onMouseLeave={cancelPreview}
                      onTouchStart={() => startPreview(url)}
                      onTouchEnd={cancelPreview}
                      onTouchCancel={cancelPreview}
                      disabled={!!saving}
                      title={isSelected ? "Affiche sélectionnée — maintenez pour aperçu" : "Cliquez pour choisir · Maintenez pour aperçu"}
                      style={{
                        position: "relative",
                        aspectRatio: "2/3",
                        borderRadius: 8,
                        overflow: "hidden",
                        border: isSelected ? "3px solid var(--red)" : "2px solid transparent",
                        cursor: saving ? "not-allowed" : "pointer",
                        background: "var(--bg-2)",
                        padding: 0,
                        opacity: isSaving ? 0.6 : 1,
                        transition: "border-color 0.15s, opacity 0.15s",
                        outline: "none",
                      }}
                    >
                      <Image
                        src={url}
                        alt="Affiche"
                        fill
                        sizes="(max-width: 560px) 25vw, 130px"
                        style={{ objectFit: "cover", objectPosition: "center top" }}
                        unoptimized
                      />
                      {isSaving && (
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ background: "rgba(0,0,0,0.4)" }}
                        >
                          <span className="text-white text-xs">⏳</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {error && (
            <p className="text-xs mt-3 text-center" style={{ color: "var(--red)" }}>{error}</p>
          )}
        </div>

        {/* Pied */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-shrink-0 gap-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={handleReset}
            disabled={!!saving || selected === null}
            className="text-xs px-3 py-2 rounded-lg"
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              color: "var(--text-3)",
              cursor: saving || selected === null ? "not-allowed" : "pointer",
              opacity: saving || selected === null ? 0.5 : 1,
            }}
          >
            Réinitialiser
          </button>
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg font-semibold text-white"
            style={{ background: "var(--red)", cursor: "pointer" }}
          >
            Confirmer
          </button>
        </div>
      </div>

      {/* ── Aperçu longpress ── */}
      {preview && (
        <div
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-4 p-6"
          style={{ background: "rgba(0,0,0,0.92)" }}
          onMouseUp={() => { cancelPreview(); setPreview(null); }}
          onTouchEnd={() => { cancelPreview(); setPreview(null); }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>
            Aperçu · Relâchez pour revenir
          </p>
          <div style={{ position: "relative", width: 220, height: 330, borderRadius: 12, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}>
            <Image
              src={preview}
              alt="Aperçu affiche"
              fill
              sizes="220px"
              style={{ objectFit: "cover", objectPosition: "center top" }}
              unoptimized
            />
          </div>
          <button
            onClick={() => { handleSelect(preview); setPreview(null); }}
            className="text-sm px-6 py-2.5 rounded-xl font-bold text-white"
            style={{ background: "var(--red)", cursor: "pointer", marginTop: 4 }}
          >
            Choisir cette affiche
          </button>
        </div>
      )}
    </div>
  );
}
