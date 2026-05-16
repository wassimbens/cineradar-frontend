"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { profilApi } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

// ── Helpers ───────────────────────────────────────────────

function useEmail() {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    setEmail(localStorage.getItem("cineradar_email"));
  }, []);
  return email;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cineradar_token");
}

// ── Types ─────────────────────────────────────────────────

interface ListeResume {
  id: string;
  slug: string;
  titre: string;
  emoji: string | null;
  _count: { films: number };
}

// ── Bouton Ajouter à une liste ────────────────────────────

function AjouterListeButton({ filmId }: { filmId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [listes, setListes] = useState<ListeResume[]>([]);
  const [loadingListes, setLoadingListes] = useState(false);
  const [feedback, setFeedback] = useState<{ slug: string; ok: boolean; msg: string } | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setToken(getToken());
  }, []);

  // Fermer le dropdown en cliquant ailleurs
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const fetchListes = useCallback(async (tok: string) => {
    setLoadingListes(true);
    try {
      const res = await fetch(`${API_URL}/api/listes/mes-listes`, {
        headers: { Authorization: `Bearer ${tok}` },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setListes(data);
      }
    } finally {
      setLoadingListes(false);
    }
  }, []);

  const handleToggle = () => {
    if (!open && token) fetchListes(token);
    setOpen((v) => !v);
    setFeedback(null);
  };

  const handleAddToList = async (liste: ListeResume) => {
    if (!token) return;
    setAdding(liste.slug);
    setFeedback(null);
    try {
      const res = await fetch(`${API_URL}/api/listes/${liste.slug}/films`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ filmId }),
      });
      if (res.ok) {
        setFeedback({ slug: liste.slug, ok: true, msg: `Ajouté à "${liste.titre}" !` });
      } else {
        const data = await res.json().catch(() => ({}));
        setFeedback({ slug: liste.slug, ok: false, msg: data.error ?? "Erreur lors de l'ajout." });
      }
    } catch {
      setFeedback({ slug: liste.slug, ok: false, msg: "Erreur réseau." });
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        style={{
          background: open ? "var(--bg-3)" : "var(--bg-2)",
          color: "var(--text-2)",
          border: `1px solid ${open ? "var(--text-2)" : "var(--border)"}`,
          cursor: "pointer",
        }}
        title="Ajouter à une liste"
      >
        📋 Ajouter à une liste
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-xl"
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            minWidth: 220,
            maxWidth: 280,
          }}
        >
          {!token ? (
            <div className="px-4 py-3">
              <p className="text-xs mb-2" style={{ color: "var(--text-3)" }}>
                Connectez-vous pour accéder à vos listes.
              </p>
              <a
                href="/profil"
                className="text-xs font-semibold no-underline"
                style={{ color: "var(--red)" }}
              >
                Se connecter →
              </a>
            </div>
          ) : loadingListes ? (
            <div className="px-4 py-3 text-sm" style={{ color: "var(--text-3)" }}>
              Chargement…
            </div>
          ) : listes.length === 0 ? (
            <div className="px-4 py-3">
              <p className="text-xs mb-2" style={{ color: "var(--text-3)" }}>
                Vous n&apos;avez pas encore de liste.
              </p>
              <a
                href="/listes"
                className="text-xs font-semibold no-underline"
                style={{ color: "var(--red)" }}
              >
                Créer une liste →
              </a>
            </div>
          ) : (
            <div className="py-1">
              {listes.map((liste) => {
                const fb = feedback?.slug === liste.slug ? feedback : null;
                return (
                  <button
                    key={liste.slug}
                    onClick={() => handleAddToList(liste)}
                    disabled={adding === liste.slug}
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors"
                    style={{
                      background: fb?.ok ? "#dcfce7" : "transparent",
                      color: fb?.ok ? "#16a34a" : fb ? "#dc2626" : "var(--text)",
                      cursor: adding === liste.slug ? "not-allowed" : "pointer",
                      border: "none",
                      opacity: adding === liste.slug ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!fb?.ok) e.currentTarget.style.background = "var(--bg-3)";
                    }}
                    onMouseLeave={(e) => {
                      if (!fb?.ok) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span>{liste.emoji ?? "📋"}</span>
                    <span className="flex-1 truncate">{liste.titre}</span>
                    {fb && (
                      <span className="text-xs flex-shrink-0">
                        {fb.ok ? "✓" : "✗"}
                      </span>
                    )}
                    {adding === liste.slug && (
                      <span className="text-xs flex-shrink-0" style={{ color: "var(--text-3)" }}>…</span>
                    )}
                  </button>
                );
              })}
              {feedback && (
                <div
                  className="px-4 py-2 text-xs border-t"
                  style={{
                    borderColor: "var(--border)",
                    color: feedback.ok ? "#16a34a" : "#dc2626",
                    background: feedback.ok ? "#f0fdf4" : "#fef2f2",
                  }}
                >
                  {feedback.msg}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Étoiles notation demi-étoile ─────────────────────────

function EtoilesSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value;

  return (
    <div className="flex gap-0.5" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const full = display >= star;
        const half = !full && display >= star - 0.5;
        return (
          <span
            key={star}
            className="text-2xl cursor-pointer select-none"
            style={{ color: full || half ? "var(--red)" : "var(--border)" }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              setHovered(x < rect.width / 2 ? star - 0.5 : star);
            }}
            onClick={() => onChange(hovered ?? star)}
          >
            {half ? "½" : "★"}
          </span>
        );
      })}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────

interface Props {
  filmId: string;
  filmTitre: string;
}

export default function ProfilActions({ filmId, filmTitre }: Props) {
  const email = useEmail();

  const [isFavori, setIsFavori]       = useState(false);
  const [isWatchlist, setIsWatchlist] = useState(false);
  const [isVu, setIsVu]               = useState(false);
  const [filmVuId, setFilmVuId]       = useState<string | null>(null);
  const [note, setNote]               = useState(0);
  const [texte, setTexte]             = useState("");
  const [showAvis, setShowAvis]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [loaded, setLoaded]           = useState(false);
  const textareaRef                   = useRef<HTMLTextAreaElement>(null);

  const MAX_CHARS = 2000;

  const applyFormat = (prefix: string, suffix: string, placeholder: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = texte.slice(start, end);
    const insertion = selected.length > 0 ? `${prefix}${selected}${suffix}` : `${prefix}${placeholder}${suffix}`;
    const newTexte = texte.slice(0, start) + insertion + texte.slice(end);
    setTexte(newTexte);
    // Sélectionner le texte inséré pour faciliter la retouche
    requestAnimationFrame(() => {
      ta.focus();
      const selStart = start + prefix.length;
      const selEnd = selected.length > 0
        ? start + prefix.length + selected.length
        : start + prefix.length + placeholder.length;
      ta.setSelectionRange(selStart, selEnd);
    });
  };

  const loadState = useCallback(async (mail: string) => {
    try {
      const p = await profilApi.getProfil(mail);
      setIsFavori(p.filmsFavoris.some((f) => f.id === filmId));
      setIsWatchlist(p.watchlist.some((f) => f.id === filmId));
      const vu = p.filmsVus.find((fv) => fv.film.id === filmId);
      if (vu) { setIsVu(true); setFilmVuId(vu.id); }
      const avis = p.avis.find((a) => a.filmId === filmId);
      if (avis) { setNote(avis.note ?? 0); setTexte(avis.texte ?? ""); }
      setLoaded(true);
    } catch { /* pas de profil encore */ setLoaded(true); }
  }, [filmId]);

  useEffect(() => {
    if (email) loadState(email);
  }, [email, loadState]);

  if (!email || !loaded) {
    return (
      <div className="mt-4 flex gap-2">
        <a
          href="/profil"
          className="text-xs px-3 py-1.5 rounded-lg no-underline"
          style={{
            background: "var(--bg-2)", border: "1px solid var(--border)",
            color: "var(--text-3)",
          }}
        >
          👤 Connectez-vous pour noter
        </a>
      </div>
    );
  }

  const toggleFavori = async () => {
    setSaving(true);
    if (isFavori) {
      await profilApi.removeFavori(email, filmId);
      setIsFavori(false);
    } else {
      await profilApi.addFavori(email, filmId);
      setIsFavori(true);
      // retirer de la watchlist si on met en favori
      if (isWatchlist) {
        await profilApi.removeWatchlist(email, filmId);
        setIsWatchlist(false);
      }
    }
    setSaving(false);
  };

  const toggleWatchlist = async () => {
    setSaving(true);
    if (isWatchlist) {
      await profilApi.removeWatchlist(email, filmId);
      setIsWatchlist(false);
    } else {
      await profilApi.addWatchlist(email, filmId);
      setIsWatchlist(true);
    }
    setSaving(false);
  };

  const handleSaveAvis = async () => {
    setSaving(true);
    if (note === 0 && !texte.trim()) {
      await profilApi.deleteAvis(email, filmId);
    } else {
      await profilApi.upsertAvis(email, filmId, {
        note: note > 0 ? note : undefined,
        texte: texte.trim() || undefined,
      });
    }
    setSaving(false);
    setShowAvis(false);
  };

  return (
    <div className="mt-4 flex flex-col gap-3">
      {/* Boutons action */}
      <div className="flex flex-wrap gap-2">
        {/* Favori */}
        <button
          onClick={toggleFavori}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: isFavori ? "var(--red)" : "var(--bg-2)",
            color: isFavori ? "white" : "var(--text-2)",
            border: `1px solid ${isFavori ? "var(--red)" : "var(--border)"}`,
            cursor: saving ? "not-allowed" : "pointer",
          }}
          title={isFavori ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          {isFavori ? "❤️" : "🤍"} Favori
        </button>

        {/* Watchlist */}
        <button
          onClick={toggleWatchlist}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: isWatchlist ? "var(--bg-3)" : "var(--bg-2)",
            color: isWatchlist ? "var(--text)" : "var(--text-2)",
            border: `1px solid ${isWatchlist ? "var(--text-2)" : "var(--border)"}`,
            cursor: saving ? "not-allowed" : "pointer",
          }}
          title={isWatchlist ? "Retirer de la watchlist" : "Ajouter à la watchlist"}
        >
          {isWatchlist ? "🔖" : "🏷️"} À voir
        </button>

        {/* Film vu */}
        <button
          onClick={async () => {
            setSaving(true);
            if (isVu && filmVuId) {
              await profilApi.removeFilmVu(email, filmVuId);
              setIsVu(false);
              setFilmVuId(null);
            } else {
              const res = await profilApi.addFilmVu(email, filmId) as { ok: boolean; filmVu?: { id: string } };
              setIsVu(true);
              if (res.filmVu?.id) setFilmVuId(res.filmVu.id);
              // Retirer de la watchlist si on marque comme vu
              if (isWatchlist) {
                await profilApi.removeWatchlist(email, filmId);
                setIsWatchlist(false);
              }
            }
            setSaving(false);
          }}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: isVu ? "#16a34a" : "var(--bg-2)",
            color: isVu ? "white" : "var(--text-2)",
            border: `1px solid ${isVu ? "#16a34a" : "var(--border)"}`,
            cursor: saving ? "not-allowed" : "pointer",
          }}
          title={isVu ? "Retirer de mes films vus" : "Marquer comme vu"}
        >
          {isVu ? "✓ Vu" : "👁 Vu"}
        </button>

        {/* Avis */}
        <button
          onClick={() => setShowAvis((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: note > 0 || texte ? "var(--bg-3)" : "var(--bg-2)",
            color: note > 0 || texte ? "var(--text)" : "var(--text-2)",
            border: `1px solid ${note > 0 || texte ? "var(--text-2)" : "var(--border)"}`,
            cursor: "pointer",
          }}
        >
          ⭐ {note > 0 ? `${note}/5` : "Noter"}
        </button>

        {/* Ajouter à une liste */}
        <AjouterListeButton filmId={filmId} />
      </div>

      {/* Panneau avis */}
      {showAvis && (
        <div
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Votre avis sur {filmTitre}
          </p>
          <EtoilesSelector value={note} onChange={setNote} />

          {/* Barre de formatage markdown */}
          <div className="flex gap-1">
            {[
              { label: "G", title: "Gras", prefix: "**", suffix: "**", placeholder: "texte en gras", style: { fontWeight: 700 } },
              { label: "I", title: "Italique", prefix: "*", suffix: "*", placeholder: "texte en italique", style: { fontStyle: "italic" } },
              { label: "❝", title: "Citation", prefix: "> ", suffix: "", placeholder: "votre citation", style: {} },
            ].map(({ label, title, prefix, suffix, placeholder, style }) => (
              <button
                key={label}
                type="button"
                title={title}
                onMouseDown={(e) => { e.preventDefault(); applyFormat(prefix, suffix, placeholder); }}
                className="px-2 py-1 rounded text-xs"
                style={{
                  background: "var(--bg-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text-2)",
                  cursor: "pointer",
                  minWidth: 28,
                  ...style,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={texte}
              onChange={(e) => setTexte(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Votre critique (facultatif)…"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{
                background: "var(--bg-3)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                minHeight: 120,
              }}
            />
            <span
              className="absolute bottom-2 right-2 text-xs select-none pointer-events-none"
              style={{ color: texte.length > 1800 ? "#dc2626" : "var(--text-3)" }}
            >
              {texte.length}/{MAX_CHARS}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveAvis}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: "var(--red)", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              onClick={() => setShowAvis(false)}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ color: "var(--text-3)", cursor: "pointer" }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
