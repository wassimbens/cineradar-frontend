"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

// ── Types ─────────────────────────────────────────────────

interface FilmDansListe {
  id: string;
  position: number | null;
  note: string | null;
  film: {
    id: string;
    titre: string;
    affiche: string | null;
    annee: number | null;
  };
}

interface MembreListe {
  id: string;
  role: "VIEWER" | "EDITOR" | "ADMIN";
  user: {
    id: string;
    pseudo: string | null;
    avatar: string | null;
  };
}

interface ListePublique {
  id: string;
  slug: string;
  titre: string;
  description: string | null;
  isPublic: boolean;
  emoji: string | null;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    pseudo: string | null;
    email: string;
    avatar: string | null;
  };
  membres: MembreListe[];
  films: FilmDansListe[];
}

interface FilmResume {
  id: string;
  titre: string;
  affiche: string | null;
  annee: number | null;
}


// ── Helpers ───────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cineradar_token");
}

function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(b64));
    return payload.userId ?? null;
  } catch {
    return null;
  }
}

// ── Film search modal ────────────────────────────────────

function FilmSearchModal({
  slug,
  existingFilmIds,
  onAdded,
  onClose,
}: {
  slug: string;
  existingFilmIds: Set<string>;
  onAdded: (film: FilmResume) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<FilmResume[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/films?q=${encodeURIComponent(q)}&limit=10`);
        const data = await res.json();
        const films = Array.isArray(data) ? data : (data.films ?? []);
        setResults(films.slice(0, 10));
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const handleAdd = async (film: FilmResume) => {
    setAdding(film.id);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/listes/${slug}/films`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ filmId: film.id }),
      });
      if (res.ok) {
        onAdded(film);
      }
    } catch { /* ignore */ }
    finally { setAdding(null); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-2xl p-4 flex flex-col gap-3"
        style={{ maxWidth: 440, background: "var(--bg-2)", border: "1px solid var(--border)", maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>Ajouter un film</span>
          <button onClick={onClose} style={{ color: "var(--text-3)", cursor: "pointer", background: "none", border: "none", fontSize: 18 }}>✕</button>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un film…"
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text)" }}
        />
        <div className="overflow-y-auto flex flex-col gap-1">
          {loading && <p className="text-xs text-center py-4" style={{ color: "var(--text-3)" }}>Recherche…</p>}
          {results.map((film) => {
            const already = existingFilmIds.has(film.id);
            return (
              <div
                key={film.id}
                className="flex items-center gap-3 p-2 rounded-lg"
                style={{ background: "var(--bg-3)" }}
              >
                <div className="flex-shrink-0 rounded overflow-hidden" style={{ width: 32, height: 48, background: "var(--bg-2)", position: "relative" }}>
                  {film.affiche ? (
                    <Image src={film.affiche} alt={film.titre} fill sizes="32px" className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs" style={{ color: "var(--text-3)" }}>🎬</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text)", textTransform: "uppercase" }}>{film.titre}</p>
                  {film.annee && <p className="text-xs" style={{ color: "var(--text-3)" }}>{film.annee}</p>}
                </div>
                <button
                  onClick={() => !already && handleAdd(film)}
                  disabled={already || adding === film.id}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{
                    background: already ? "var(--bg-2)" : "var(--red)",
                    color: already ? "var(--text-3)" : "white",
                    border: "none",
                    cursor: already ? "default" : "pointer",
                    opacity: adding === film.id ? 0.6 : 1,
                  }}
                >
                  {already ? "Déjà ajouté" : adding === film.id ? "…" : "Ajouter"}
                </button>
              </div>
            );
          })}
          {!loading && q.trim() && results.length === 0 && (
            <p className="text-xs text-center py-4" style={{ color: "var(--text-3)" }}>Aucun résultat</p>
          )}
          {!q.trim() && (
            <p className="text-xs text-center py-4" style={{ color: "var(--text-3)" }}>Tapez le titre d&apos;un film…</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function ListePubliquePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [liste, setListe] = useState<ListePublique | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"404" | "403" | "unknown" | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [invitePseudo, setInvitePseudo] = useState("");
  const [inviteRole, setInviteRole] = useState<"VIEWER" | "EDITOR">("VIEWER");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  const token = typeof window !== "undefined" ? getToken() : null;
  const currentUserId = getUserIdFromToken(token);

  const fetchListe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const t = getToken();
      const headers: Record<string, string> = {};
      if (t) headers["Authorization"] = `Bearer ${t}`;

      const res = await fetch(`${API_URL}/api/listes/${slug}`, {
        headers,
        credentials: "include",
      });

      if (res.status === 404) { setError("404"); return; }
      if (res.status === 403) { setError("403"); return; }
      if (!res.ok) { setError("unknown"); return; }

      const data = await res.json();
      setListe(data);
    } catch {
      setError("unknown");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchListe(); }, [fetchListe]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: liste?.titre, url });
      } catch {
        // annulé par l'utilisateur
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── États ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="px-6 py-12 mx-auto" style={{ maxWidth: 900 }}>
        <div
          className="rounded-2xl mb-6"
          style={{ height: 120, background: "var(--bg-2)", border: "1px solid var(--border)", opacity: 0.5 }}
        />
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl"
              style={{ aspectRatio: "2/3", background: "var(--bg-2)", border: "1px solid var(--border)", opacity: 0.4 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error === "404") {
    return (
      <div className="px-6 py-24 mx-auto text-center" style={{ maxWidth: 500 }}>
        <p className="text-5xl mb-4">🎞️</p>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: "var(--text)" }}>Liste introuvable</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-3)" }}>
          Cette liste n&apos;existe pas ou a été supprimée.
        </p>
        <Link
          href="/listes"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white no-underline"
          style={{ background: "var(--red)" }}
        >
          Mes listes
        </Link>
      </div>
    );
  }

  if (error === "403") {
    return (
      <div className="px-6 py-24 mx-auto text-center" style={{ maxWidth: 500 }}>
        <p className="text-5xl mb-4">🔒</p>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: "var(--text)" }}>Liste privée</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-3)" }}>
          Cette liste est privée. Seul son auteur peut la consulter.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold no-underline"
          style={{ background: "var(--bg-2)", color: "var(--text)", border: "1px solid var(--border)" }}
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  if (error || !liste) {
    return (
      <div className="px-6 py-24 mx-auto text-center" style={{ maxWidth: 500 }}>
        <p className="text-5xl mb-4">⚠️</p>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: "var(--text)" }}>Erreur de chargement</h1>
        <button
          onClick={fetchListe}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--red)", border: "none", cursor: "pointer" }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  const nomAuteur = liste.author?.pseudo ?? liste.author?.email?.split("@")[0] ?? "Utilisateur";
  const isOwner = currentUserId !== null && liste.author?.id === currentUserId;
  const existingFilmIds = new Set(liste.films.map((f) => f.film.id));

  const handleInvite = async () => {
    if (!invitePseudo.trim()) return;
    setInviteLoading(true);
    setInviteError(null);
    try {
      const t = getToken();
      const res = await fetch(`${API_URL}/api/listes/${slug}/membres`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
        body: JSON.stringify({ pseudo: invitePseudo.trim(), role: inviteRole }),
      });
      if (res.ok) {
        setInvitePseudo("");
        await fetchListe();
      } else {
        const d = await res.json().catch(() => ({}));
        setInviteError(d.error ?? "Erreur");
      }
    } catch { setInviteError("Erreur réseau"); }
    finally { setInviteLoading(false); }
  };

  const handleRemoveMembre = async (userId: string) => {
    const t = getToken();
    await fetch(`${API_URL}/api/listes/${slug}/membres/${userId}`, {
      method: "DELETE",
      headers: t ? { Authorization: `Bearer ${t}` } : {},
    });
    await fetchListe();
  };

  const handleFilmAdded = (film: FilmResume) => {
    setListe((prev) => {
      if (!prev) return prev;
      const newEntry: FilmDansListe = {
        id: film.id,
        position: null,
        note: null,
        film: { id: film.id, titre: film.titre, affiche: film.affiche, annee: film.annee },
      };
      return { ...prev, films: [...prev.films, newEntry] };
    });
  };

  return (
    <div className="px-6 py-10 mx-auto" style={{ maxWidth: 900 }}>
      {/* Bouton retour */}
      <Link
        href="/listes"
        className="inline-flex items-center gap-1 text-sm mb-8 no-underline"
        style={{ color: "var(--text-3)" }}
      >
        ← Mes listes
      </Link>

      {/* Cover image banner */}
      {liste.coverImage && (
        <div
          className="relative rounded-2xl overflow-hidden mb-4"
          style={{ height: 200 }}
        >
          <Image
            src={liste.coverImage}
            alt={liste.titre}
            fill
            className="object-cover"
            sizes="(max-width: 900px) 100vw, 900px"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55))" }}
          />
        </div>
      )}

      {/* Header */}
      <div
        className="rounded-2xl p-6 mb-8"
        style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              {liste.emoji && (
                <span className="text-4xl">{liste.emoji}</span>
              )}
              <h1
                className="text-2xl font-extrabold"
                style={{ color: "var(--text)", letterSpacing: "-0.02em" }}
              >
                {liste.titre}
              </h1>
              {/* Badge public/privé */}
              <span
                className="px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  background: liste.isPublic ? "#dcfce7" : "var(--bg-3)",
                  color: liste.isPublic ? "#16a34a" : "var(--text-3)",
                  border: `1px solid ${liste.isPublic ? "#86efac" : "var(--border)"}`,
                }}
              >
                {liste.isPublic ? "Publique" : "Privée"}
              </span>
            </div>

            {liste.description && (
              <p className="text-sm mb-3" style={{ color: "var(--text-2)", lineHeight: 1.6 }}>
                {liste.description}
              </p>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "var(--text-3)" }}>
              <span>Par <strong style={{ color: "var(--text-2)" }}>{nomAuteur}</strong></span>
              <span>Créée le {formatDate(liste.createdAt)}</span>
              <span>{liste.films.length} film{liste.films.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isOwner && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{
                  background: "var(--red)",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                + Ajouter un film
              </button>
            )}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{
                background: copied ? "#dcfce7" : "var(--bg-3)",
                color: copied ? "#16a34a" : "var(--text-2)",
                border: `1px solid ${copied ? "#86efac" : "var(--border)"}`,
                cursor: "pointer",
              }}
            >
              {copied ? "✓ Lien copié !" : "🔗 Partager"}
            </button>
          </div>
        </div>
      </div>

      {/* Grille de films */}
      {liste.films.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <p className="text-4xl mb-4">🍿</p>
          <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>
            Aucun film dans cette liste
          </p>
          {isOwner ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "var(--red)", border: "none", cursor: "pointer" }}
            >
              + Ajouter un film
            </button>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              L&apos;auteur n&apos;a pas encore ajouté de films.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {liste.films.map(({ film }) => (
            <Link
              key={film.id}
              href={`/films/${film.id}`}
              className="no-underline group"
            >
              <div
                className="rounded-xl overflow-hidden"
                style={{ background: "var(--bg-2)", border: "1px solid var(--border)", transition: "transform 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
              >
                {/* Affiche */}
                <div
                  className="relative w-full"
                  style={{ aspectRatio: "2/3", background: "var(--bg-3)" }}
                >
                  {film.affiche ? (
                    <Image
                      src={film.affiche}
                      alt={film.titre}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center text-3xl"
                      style={{ color: "var(--text-3)" }}
                    >
                      🎬
                    </div>
                  )}
                </div>

                {/* Infos */}
                <div className="p-2.5">
                  <p
                    className="font-semibold text-xs leading-snug mb-0.5"
                    style={{ color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.02em" }}
                  >
                    {film.titre}
                  </p>
                  {film.annee && (
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>
                      {film.annee}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Section membres (visible pour l'auteur et les membres) */}
      {(isOwner || (liste.membres && liste.membres.some((m) => m.user.id === currentUserId))) && (
        <div
          className="mt-10 rounded-2xl p-6"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <h2 className="font-extrabold text-base mb-4" style={{ color: "var(--text)" }}>
            Membres collaborateurs
          </h2>

          {/* Liste des membres */}
          <div className="flex flex-col gap-2 mb-4">
            {liste.membres.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-3)" }}>
                Aucun membre pour l&apos;instant.
              </p>
            ) : (
              liste.membres.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl"
                  style={{ background: "var(--bg-3)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                      @{m.user.pseudo ?? "…"}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: m.role === "EDITOR" ? "#fef3c7" : "var(--bg-2)",
                        color: m.role === "EDITOR" ? "#92400e" : "var(--text-3)",
                        border: `1px solid ${m.role === "EDITOR" ? "#fde68a" : "var(--border)"}`,
                      }}
                    >
                      {m.role === "EDITOR" ? "Éditeur" : "Lecteur"}
                    </span>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleRemoveMembre(m.user.id)}
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{ color: "var(--text-3)", border: "1px solid var(--border)", background: "var(--bg-2)", cursor: "pointer" }}
                      title="Retirer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Formulaire d'invitation (auteur uniquement) */}
          {isOwner && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold" style={{ color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Inviter un membre
              </p>
              <div className="flex gap-2 flex-wrap">
                <input
                  value={invitePseudo}
                  onChange={(e) => setInvitePseudo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  placeholder="@pseudo…"
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "VIEWER" | "EDITOR")}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text)", cursor: "pointer" }}
                >
                  <option value="VIEWER">Lecteur</option>
                  <option value="EDITOR">Éditeur</option>
                </select>
                <button
                  onClick={handleInvite}
                  disabled={!invitePseudo.trim() || inviteLoading}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ background: "var(--red)", border: "none", cursor: invitePseudo.trim() ? "pointer" : "not-allowed", opacity: invitePseudo.trim() ? 1 : 0.5 }}
                >
                  {inviteLoading ? "…" : "Inviter"}
                </button>
              </div>
              {inviteError && <p className="text-xs" style={{ color: "var(--red)" }}>{inviteError}</p>}
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                Un éditeur peut ajouter/retirer des films. Un lecteur peut consulter la liste privée.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal recherche film */}
      {showAddModal && (
        <FilmSearchModal
          slug={slug}
          existingFilmIds={existingFilmIds}
          onAdded={handleFilmAdded}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
