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
  thumbnail: string | null;
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

function compressImage(file: File, maxPx = 400, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
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
  const [coverUploading, setCoverUploading] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);

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

  const handleCoverUpload = async (file: File) => {
    setCoverUploading(true);
    try {
      // Compression côté client via Canvas
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new window.Image();
          img.onload = () => {
            const MAX = 1200;
            const scale = Math.min(1, MAX / Math.max(img.width, img.height));
            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL("image/jpeg", 0.8));
          };
          img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
      });

      const t = getToken();
      await fetch(`${API_URL}/api/listes/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
        body: JSON.stringify({ coverImage: dataUrl }),
      });
      setListe((prev) => prev ? { ...prev, coverImage: dataUrl } : prev);
    } catch { /* ignore */ }
    finally { setCoverUploading(false); }
  };

  const handleThumbnailUpload = async (file: File) => {
    setThumbUploading(true);
    try {
      const dataUrl = await compressImage(file, 400, 0.82);
      const t = getToken();
      await fetch(`${API_URL}/api/listes/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) },
        body: JSON.stringify({ thumbnail: dataUrl }),
      });
      setListe((prev) => prev ? { ...prev, thumbnail: dataUrl } : prev);
    } catch { /* ignore */ }
    finally { setThumbUploading(false); }
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

      {/* Cover image banner — ratio 4:1, hauteur clampée */}
      {liste.coverImage ? (
        <div
          className="relative rounded-2xl overflow-hidden mb-4"
          style={{ height: "clamp(110px, 28vw, 200px)" }}
        >
          <Image
            src={liste.coverImage}
            alt={liste.titre}
            fill
            className="object-cover"
            sizes="(max-width: 900px) 100vw, 900px"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5))" }} />
          {isOwner && (
            <label
              className="absolute bottom-2 right-2 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
              style={{ background: "rgba(0,0,0,0.55)", color: "white", backdropFilter: "blur(4px)" }}
            >
              {coverUploading ? "…" : "📷 Changer"}
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); e.target.value = ""; }} />
            </label>
          )}
        </div>
      ) : isOwner ? (
        <label
          className="flex items-center justify-center gap-2 rounded-2xl mb-4 cursor-pointer text-sm"
          style={{ height: 60, background: "var(--bg-2)", border: "2px dashed var(--border)", color: "var(--text-3)" }}
        >
          {coverUploading ? "Traitement…" : "📷 Ajouter une bannière"}
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); e.target.value = ""; }} />
        </label>
      ) : null}

      {/* Header — layout vertical sur mobile, plus de superposition */}
      <div
        className="rounded-2xl p-4 mb-6"
        style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
      >
        {/* Ligne 1 : icône + titre + badge */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          {/* Icône ronde */}
          {isOwner ? (
            <label className="relative cursor-pointer flex-shrink-0" title="Changer la photo">
              <div className="flex items-center justify-center overflow-hidden"
                style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--bg-3)", border: "2px solid var(--border)" }}>
                {thumbUploading ? <span style={{ fontSize: 12, color: "var(--text-3)" }}>…</span>
                  : liste.thumbnail ? <img src={liste.thumbnail} alt={liste.titre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span className="text-3xl">{liste.emoji ?? "🎬"}</span>}
              </div>
              <div className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 hover:opacity-100"
                style={{ background: "rgba(0,0,0,0.45)", transition: "opacity 0.15s" }}>
                <span style={{ fontSize: 16 }}>📷</span>
              </div>
              <input type="file" accept="image/*" className="hidden"
                onChange={async (e) => { const f = e.target.files?.[0]; if (f) await handleThumbnailUpload(f); e.target.value = ""; }} />
            </label>
          ) : (
            <div className="flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--bg-3)", border: "1px solid var(--border)" }}>
              {liste.thumbnail
                ? <img src={liste.thumbnail} alt={liste.titre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span className="text-3xl">{liste.emoji ?? "🎬"}</span>}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
                {liste.titre}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                style={{
                  background: liste.isPublic ? "#dcfce7" : "var(--bg-3)",
                  color: liste.isPublic ? "#16a34a" : "var(--text-3)",
                  border: `1px solid ${liste.isPublic ? "#86efac" : "var(--border)"}`,
                }}>
                {liste.isPublic ? "Publique" : "Privée"}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {liste.description && (
          <p className="text-sm mb-3" style={{ color: "var(--text-2)", lineHeight: 1.6 }}>
            {liste.description}
          </p>
        )}

        {/* Méta */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mb-4" style={{ color: "var(--text-3)" }}>
          <span>Par <strong style={{ color: "var(--text-2)" }}>{nomAuteur}</strong></span>
          <span>·</span>
          <span>{formatDate(liste.createdAt)}</span>
          <span>·</span>
          <span>{liste.films.length} film{liste.films.length !== 1 ? "s" : ""}</span>
        </div>

        {/* CTAs — toujours sous le contenu, jamais en regard */}
        <div className="flex gap-2 flex-wrap">
          {isOwner && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "var(--red)", color: "white", border: "none", cursor: "pointer" }}
            >
              + Ajouter un film
            </button>
          )}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: copied ? "#dcfce7" : "var(--bg-3)",
              color: copied ? "#16a34a" : "var(--text-2)",
              border: `1px solid ${copied ? "#86efac" : "var(--border)"}`,
              cursor: "pointer",
            }}
          >
            {copied ? "✓ Copié !" : "🔗 Partager"}
          </button>
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
        <div className="grid gap-2 grid-cols-4 md:gap-4">
          {liste.films.map(({ film }) => (
            <Link
              key={film.id}
              href={`/films/${film.id}`}
              className="no-underline group"
            >
              <div
                className="rounded-lg md:rounded-xl overflow-hidden"
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
                      sizes="(max-width: 640px) 25vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center text-xl"
                      style={{ color: "var(--text-3)" }}
                    >
                      🎬
                    </div>
                  )}
                </div>

                {/* Infos */}
                <div className="p-1.5 md:p-2.5">
                  <p
                    className="font-semibold leading-snug mb-0.5"
                    style={{ fontSize: 10, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.02em" }}
                  >
                    {film.titre}
                  </p>
                  {film.annee && (
                    <p style={{ fontSize: 9, color: "var(--text-3)" }}>
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
