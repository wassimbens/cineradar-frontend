"use client";

import { useState, useEffect, useCallback } from "react";
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

interface ListePublique {
  id: string;
  slug: string;
  titre: string;
  description: string | null;
  isPublic: boolean;
  emoji: string | null;
  createdAt: string;
  updatedAt: string;
  auteur: {
    pseudo: string | null;
    email: string;
  };
  films: FilmDansListe[];
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

// ── Page ──────────────────────────────────────────────────

export default function ListePubliquePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [liste, setListe] = useState<ListePublique | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"404" | "403" | "unknown" | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchListe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

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

  const nomAuteur = liste.auteur?.pseudo ?? liste.auteur?.email?.split("@")[0] ?? "Utilisateur";

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

          {/* Bouton Partager */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0"
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
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            L&apos;auteur n&apos;a pas encore ajouté de films.
          </p>
        </div>
      ) : (
        <div
          className="grid gap-4 grid-cols-2 md:grid-cols-4"
        >
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

    </div>
  );
}
