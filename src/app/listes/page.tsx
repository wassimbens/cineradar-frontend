"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

// ── Types ─────────────────────────────────────────────────

interface ListeResume {
  id: string;
  slug: string;
  titre: string;
  description: string | null;
  isPublic: boolean;
  emoji: string | null;
  thumbnail: string | null;
  updatedAt: string;
  _count: { films: number };
}

// ── Helpers ───────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cineradar_token");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const EMOJIS = ["🎬", "🎭", "🏆", "😂", "💀", "🌟", "🎞️", "🍿"];

// ── Composant ─────────────────────────────────────────────

export default function MesListesPage() {
  const [token, setToken] = useState<string | null>(null);
  const [listes, setListes] = useState<ListeResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Formulaire création
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("🎬");
  const [newThumbnail, setNewThumbnail] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Suppression / thumbnail update
  const [deleting, setDeleting] = useState<string | null>(null);
  const [thumbUploading, setThumbUploading] = useState<string | null>(null);

  useEffect(() => {
    setToken(getToken());
  }, []);

  const fetchListes = useCallback(async (tok: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/listes/mes-listes`, {
        headers: { Authorization: `Bearer ${tok}` },
        credentials: "include",
      });
      if (!res.ok) { setError("Impossible de charger vos listes."); return; }
      setListes(await res.json());
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchListes(token);
    else setLoading(false);
  }, [token, fetchListes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !titre.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch(`${API_URL}/api/listes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({
          titre: titre.trim(),
          description: description.trim() || undefined,
          emoji,
          isPublic,
          thumbnail: newThumbnail || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error ?? "Erreur lors de la création."); return; }
      setListes((prev) => [data, ...prev]);
      setTitre("");
      setDescription("");
      setEmoji("🎬");
      setNewThumbnail("");
      setIsPublic(true);
    } catch {
      setCreateError("Impossible de contacter le serveur.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!token) return;
    if (!window.confirm("Supprimer cette liste définitivement ?")) return;
    setDeleting(slug);
    try {
      const res = await fetch(`${API_URL}/api/listes/${slug}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (res.ok) setListes((prev) => prev.filter((l) => l.slug !== slug));
    } finally {
      setDeleting(null);
    }
  };

  const handleThumbUpload = async (slug: string, file: File) => {
    if (!token) return;
    setThumbUploading(slug);
    try {
      const dataUrl = await compressImage(file, 400, 0.82);
      await fetch(`${API_URL}/api/listes/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ thumbnail: dataUrl }),
      });
      setListes((prev) => prev.map((l) => l.slug === slug ? { ...l, thumbnail: dataUrl } : l));
    } finally {
      setThumbUploading(null);
    }
  };

  // ── Non connecté ──────────────────────────────────────────

  if (!loading && !token) {
    return (
      <div className="px-6 py-24 mx-auto text-center" style={{ maxWidth: 500 }}>
        <p className="text-5xl mb-4">📋</p>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: "var(--text)" }}>Mes listes</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-3)" }}>
          Connectez-vous pour créer des listes thématiques et partager vos sélections.
        </p>
        <Link href="/profil" className="px-6 py-3 rounded-xl text-sm font-semibold text-white no-underline" style={{ background: "var(--red)" }}>
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 py-10 mx-auto" style={{ maxWidth: 800 }}>
      <h1 className="text-3xl font-extrabold mb-2" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
        Mes listes
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-3)" }}>
        Créez des sélections thématiques de films et partagez-les.
      </p>

      {/* ── Formulaire de création ─────────────────────────── */}
      <div className="rounded-2xl p-6 mb-8" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
        <h2 className="text-base font-extrabold mb-4" style={{ color: "var(--text)" }}>Nouvelle liste</h2>

        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          {/* Titre */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-2)" }}>Titre *</label>
            <input
              type="text" value={titre} onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex : Meilleurs films des années 80…" required maxLength={100}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--bg-3)", border: "1.5px solid var(--border)", color: "var(--text)" }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-2)" }}>Description (optionnel)</label>
            <input
              type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Une courte description de votre liste…" maxLength={300}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--bg-3)", border: "1.5px solid var(--border)", color: "var(--text)" }}
            />
          </div>

          {/* Icône : emoji OU photo ronde */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-2)" }}>
              Icône
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Thumbnail upload / aperçu */}
              <label className="relative cursor-pointer flex-shrink-0" title="Choisir une photo">
                <div
                  className="flex items-center justify-center overflow-hidden"
                  style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: "var(--bg-3)",
                    border: newThumbnail ? "2px solid var(--red)" : "2px dashed var(--border)",
                  }}
                >
                  {newThumbnail ? (
                    <img src={newThumbnail} alt="Aperçu" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 20, color: "var(--text-3)" }}>📷</span>
                  )}
                </div>
                {newThumbnail && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setNewThumbnail(""); }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white"
                    style={{ background: "var(--text-3)", fontSize: 9, border: "none", cursor: "pointer" }}
                  >✕</button>
                )}
                <input
                  type="file" accept="image/*" className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setNewThumbnail(await compressImage(f, 400, 0.82));
                    e.target.value = "";
                  }}
                />
              </label>

              <span className="text-xs" style={{ color: "var(--text-3)" }}>ou</span>

              {/* Emoji picker */}
              <div className="flex gap-2 flex-wrap">
                {EMOJIS.map((e) => (
                  <button
                    key={e} type="button"
                    onClick={() => { setEmoji(e); setNewThumbnail(""); }}
                    className="text-xl rounded-xl p-2 transition-colors"
                    style={{
                      background: !newThumbnail && emoji === e ? "var(--bg-3)" : "transparent",
                      border: `2px solid ${!newThumbnail && emoji === e ? "var(--red)" : "var(--border)"}`,
                      cursor: "pointer", lineHeight: 1,
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Toggle public/privé */}
          <div className="flex items-center gap-3">
            <button
              type="button" onClick={() => setIsPublic((v) => !v)}
              className="relative flex-shrink-0"
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: isPublic ? "var(--red)" : "var(--bg-3)",
                border: "1.5px solid var(--border)", cursor: "pointer", transition: "background 0.2s",
              }}
            >
              <span style={{
                position: "absolute", top: 2, left: isPublic ? 22 : 2,
                width: 16, height: 16, borderRadius: "50%", background: "white", transition: "left 0.2s",
              }} />
            </button>
            <span className="text-sm" style={{ color: "var(--text-2)" }}>
              {isPublic ? "Publique — visible par tous" : "Privée — visible uniquement par vous"}
            </span>
          </div>

          {createError && (
            <p className="text-sm px-3 py-2 rounded-xl" style={{ background: "#fee2e2", color: "#991b1b" }}>
              {createError}
            </p>
          )}

          <button
            type="submit" disabled={creating || !titre.trim()}
            className="self-start px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{
              background: creating || !titre.trim() ? "var(--text-3)" : "var(--red)",
              border: "none", cursor: creating || !titre.trim() ? "not-allowed" : "pointer",
            }}
          >
            {creating ? "Création…" : "Créer la liste →"}
          </button>
        </form>
      </div>

      {/* ── Liste des listes ───────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl" style={{ height: 76, background: "var(--bg-2)", border: "1px solid var(--border)", opacity: 0.5 }} />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-center py-8" style={{ color: "var(--text-3)" }}>{error}</p>
      ) : listes.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
          <p className="text-4xl mb-3">🎞️</p>
          <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>Aucune liste pour l&apos;instant</p>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>Créez votre première sélection de films ci-dessus.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {listes.map((liste) => (
            <div key={liste.id} className="rounded-2xl px-5 py-4 flex items-center gap-4" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>

              {/* Icône ronde cliquable pour changer la photo */}
              <label className="relative cursor-pointer flex-shrink-0" title="Changer la photo" style={{ minWidth: 44 }}>
                <div
                  className="flex items-center justify-center overflow-hidden"
                  style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--bg-3)", border: "1px solid var(--border)" }}
                >
                  {thumbUploading === liste.slug ? (
                    <span style={{ fontSize: 12, color: "var(--text-3)" }}>…</span>
                  ) : liste.thumbnail ? (
                    <img src={liste.thumbnail} alt={liste.titre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span className="text-2xl">{liste.emoji ?? "📋"}</span>
                  )}
                </div>
                <input
                  type="file" accept="image/*" className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) await handleThumbUpload(liste.slug, f);
                    e.target.value = "";
                  }}
                />
              </label>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <Link href={`/listes/${liste.slug}`} className="no-underline" style={{ color: "var(--text)" }}>
                  <p className="font-semibold text-sm leading-snug">{liste.titre}</p>
                </Link>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                  {liste._count.films} film{liste._count.films !== 1 ? "s" : ""}
                  {" · "}{liste.isPublic ? "Publique" : "Privée"}
                  {" · "}Modifiée le {formatDate(liste.updatedAt)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={`/listes/${liste.slug}`} className="text-xs px-3 py-1.5 rounded-lg no-underline"
                  style={{ background: "var(--bg-3)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                  Voir
                </Link>
                <button
                  onClick={() => handleDelete(liste.slug)} disabled={deleting === liste.slug}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{
                    background: "transparent", color: "#ef4444", border: "1px solid #fca5a5",
                    cursor: deleting === liste.slug ? "not-allowed" : "pointer",
                    opacity: deleting === liste.slug ? 0.6 : 1,
                  }}
                >
                  {deleting === liste.slug ? "…" : "Supprimer"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
