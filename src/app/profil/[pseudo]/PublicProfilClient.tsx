"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { socialApi, type PublicProfil, type AvisUtilisateur, type FilmVuItem, type UserSearch } from "@/lib/api";
import FilmPoster from "@/components/FilmPoster";
import FollowListModal from "@/components/FollowListModal";

// ─────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────

function EtoilesNote({ note }: { note: number | null }) {
  if (!note) return null;
  const full = Math.floor(note);
  const half = note % 1 >= 0.5;
  return (
    <span className="text-xs font-bold" style={{ color: "var(--red)" }}>
      {"★".repeat(full)}{half ? "½" : ""} {note}/5
    </span>
  );
}

// ─────────────────────────────────────────────────────────
//  Bouton follow
// ─────────────────────────────────────────────────────────

function FollowButton({ pseudo, myPseudo }: { pseudo: string; myPseudo: string | null }) {
  const [following, setFollowing] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    socialApi.isFollowing(pseudo).then((r) => setFollowing(r.following)).catch(() => setFollowing(false));
  }, [pseudo]);

  if (!myPseudo || myPseudo === pseudo) return null;

  const toggle = async () => {
    setLoading(true);
    try {
      if (following) {
        await socialApi.unfollow(pseudo);
        setFollowing(false);
      } else {
        await socialApi.follow(pseudo);
        setFollowing(true);
      }
    } catch {
      alert("Connectez-vous pour suivre cet utilisateur.");
    } finally { setLoading(false); }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading || following === null}
      className="px-4 py-2 rounded-xl font-semibold text-sm"
      style={{
        background: following ? "var(--bg-3)" : "var(--red)",
        color: following ? "var(--text-2)" : "white",
        border: following ? "1px solid var(--border)" : "none",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
      }}
    >
      {following ? "✓ Suivi" : "Suivre"}
    </button>
  );
}

// ─────────────────────────────────────────────────────────
//  Tabs de contenu
// ─────────────────────────────────────────────────────────

type Tab = "vitrine" | "vus" | "avis";

function VitrineTab({ profil, posterChoices }: { profil: PublicProfil; posterChoices: Record<string, string> }) {
  const avisMap = new Map(profil.avis.map((a) => [a.filmId, a.note]));
  const slots = [1, 2, 3, 4].map((pos) => ({
    pos,
    film: profil.filmsFavoris.find((f) => f.position === pos) ?? null,
  }));
  const recentFilms = profil.filmsVus.slice(0, 12);
  const posterFor = (filmId: string, def: string | null) => posterChoices[filmId] ?? def;

  return (
    <div className="flex flex-col gap-8">
      {/* 4 films favoris */}
      <div>
        <h2 className="text-sm font-bold mb-4" style={{ color: "var(--text)" }}>
          🎬 Films préférés
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {slots.map(({ pos, film }) => (
            <div key={pos}>
              {film ? (
                <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "2/3", background: "var(--bg-3)" }}>
                  <Link href={`/films/${film.id}`} className="block w-full h-full">
                    <FilmPoster src={posterFor(film.id, film.affiche)} alt={film.titre} fill sizes="(max-width: 640px) 25vw, 200px" />
                  </Link>
                  <div
                    className="absolute bottom-0 left-0 right-0 px-2 py-1"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)" }}
                  >
                    <p className="text-xs font-bold truncate text-white" style={{ textTransform: "uppercase" }}>
                      {film.titre}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className="rounded-xl"
                  style={{ aspectRatio: "2/3", background: "var(--bg-3)", border: "1px dashed var(--border)", opacity: 0.4 }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Films vus récents */}
      {recentFilms.length > 0 && (
        <div>
          <h2 className="text-sm font-bold mb-4" style={{ color: "var(--text)" }}>
            ✓ Films récemment vus
          </h2>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))" }}>
            {recentFilms.map((fv) => {
              const note = avisMap.get(fv.film.id) ?? null;
              const date = new Date(fv.dateVu).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
              return (
                <div key={fv.id} className="rounded-xl overflow-hidden" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                  <Link href={`/films/${fv.film.id}`} className="no-underline block">
                    <div className="relative w-full" style={{ aspectRatio: "2/3", background: "var(--bg-3)" }}>
                      <FilmPoster src={posterFor(fv.film.id, fv.film.affiche)} alt={fv.film.titre} fill sizes="110px" />
                      <div className="absolute bottom-1 left-1 text-xs px-1.5 py-0.5 rounded font-semibold" style={{ background: "rgba(0,0,0,0.72)", color: "#fff" }}>
                        ✓ {date}
                      </div>
                    </div>
                    <div className="p-1.5">
                      <p className="text-xs font-semibold leading-snug truncate" style={{ color: "var(--text)", textTransform: "uppercase" }}>{fv.film.titre}</p>
                      {note !== null && <EtoilesNote note={note} />}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function FilmsVusTab({ filmsVus, posterChoices }: { filmsVus: FilmVuItem[]; posterChoices: Record<string, string> }) {
  const posterFor = (filmId: string, def: string | null) => posterChoices[filmId] ?? def;
  if (filmsVus.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-3xl mb-3">🎬</p>
        <p className="text-sm" style={{ color: "var(--text-3)" }}>Aucun film marqué comme vu</p>
      </div>
    );
  }
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}>
      {filmsVus.map((fv) => {
        const date = new Date(fv.dateVu).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
        return (
          <div key={fv.id} className="rounded-xl overflow-hidden" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
            <Link href={`/films/${fv.film.id}`} className="no-underline block">
              <div className="relative w-full" style={{ aspectRatio: "2/3", background: "var(--bg-3)" }}>
                <FilmPoster src={posterFor(fv.film.id, fv.film.affiche)} alt={fv.film.titre} fill sizes="120px" />
                <div className="absolute bottom-1 left-1 text-xs px-1.5 py-0.5 rounded font-semibold" style={{ background: "rgba(0,0,0,0.72)", color: "#fff" }}>
                  ✓ {date}
                </div>
              </div>
              <div className="p-2">
                <p className="text-xs font-semibold leading-snug truncate" style={{ color: "var(--text)", textTransform: "uppercase" }}>{fv.film.titre}</p>
                {fv.film.annee && <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{fv.film.annee}</p>}
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

function AvisTab({ avis }: { avis: AvisUtilisateur[] }) {
  if (avis.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-3xl mb-3">⭐</p>
        <p className="text-sm" style={{ color: "var(--text-3)" }}>Aucun avis publié</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {avis.map((a) => {
        const film = a.film;
        let date = "";
        try { date = new Date(a.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }); } catch {}
        return (
          <div key={a.filmId} className="flex gap-3 p-3 rounded-xl" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
            <Link href={`/films/${a.filmId}`} className="no-underline flex-shrink-0">
              <div className="rounded-lg overflow-hidden" style={{ width: 48, height: 72, position: "relative", background: "var(--bg-3)" }}>
                <FilmPoster src={film?.affiche ?? null} alt={film?.titre ?? ""} fill sizes="48px" />
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/films/${a.filmId}`} className="no-underline">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text)", textTransform: "uppercase" }}>{film?.titre ?? "Film"}</p>
              </Link>
              {film?.annee && <p className="text-xs" style={{ color: "var(--text-3)" }}>{film.annee}</p>}
              <EtoilesNote note={a.note} />
              {a.texte && <p className="text-xs mt-1 italic line-clamp-3" style={{ color: "var(--text-2)" }}>&laquo;&nbsp;{a.texte}&nbsp;&raquo;</p>}
              {date && <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{date}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────

export default function PublicProfilClient({ pseudo }: { pseudo: string }) {
  const [profil, setProfil] = useState<PublicProfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("vitrine");
  const [myPseudo, setMyPseudo] = useState<string | null>(null);
  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);
  const [followList, setFollowList] = useState<UserSearch[]>([]);
  const [followListLoading, setFollowListLoading] = useState(false);
  const [posterChoices, setPosterChoices] = useState<Record<string, string>>({});

  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

  const loadProfil = useCallback(async () => {
    setLoading(true);
    try {
      const p = await socialApi.getPublicProfil(pseudo);
      setProfil(p);
    } catch {
      setNotFound(true);
    } finally { setLoading(false); }
  }, [pseudo]);

  useEffect(() => {
    fetch(`${API}/api/profils/${encodeURIComponent(pseudo)}/poster-choices`)
      .then(r => r.ok ? r.json() : {})
      .then((data: Record<string, string>) => setPosterChoices(data))
      .catch(() => {});
  }, [pseudo, API]);

  useEffect(() => {
    loadProfil();
    // Récupère le pseudo de l'utilisateur connecté
    const token = localStorage.getItem("cineradar_token");
    if (token) {
      // Decode pseudo from token (JWT payload)
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setMyPseudo(payload.pseudo ?? null);
      } catch {}
    }
  }, [loadProfil]);

  const openFollowModal = async (type: "followers" | "following") => {
    setFollowModal(type);
    setFollowList([]);
    setFollowListLoading(true);
    try {
      const list = type === "followers"
        ? await socialApi.getFollowers(pseudo)
        : await socialApi.getFollowing(pseudo);
      setFollowList(list);
    } catch { setFollowList([]); }
    finally { setFollowListLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p style={{ color: "var(--text-3)" }}>Chargement du profil…</p>
      </div>
    );
  }

  if (notFound || !profil) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: "var(--text)" }}>Profil introuvable</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-3)" }}>Le profil @{pseudo} n&apos;existe pas ou est privé.</p>
        <Link href="/profil" className="px-4 py-2 rounded-xl text-sm font-semibold no-underline" style={{ background: "var(--red)", color: "white" }}>
          Mon profil
        </Link>
      </div>
    );
  }

  const initiales = (profil.nom ?? profil.pseudo ?? "?").slice(0, 2).toUpperCase();

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: "vitrine", label: "Vitrine",    count: profil.filmsFavoris.filter(f => f.position >= 1).length },
    { id: "vus",     label: "Films vus",  count: profil.stats.filmsVus },
    { id: "avis",    label: "Avis",       count: profil.stats.avis },
  ];

  return (
    <div className="px-6 py-10 mx-auto" style={{ maxWidth: 900 }}>
      {/* Breadcrumb */}
      <div className="mb-6 text-xs" style={{ color: "var(--text-3)" }}>
        <Link href="/" className="no-underline" style={{ color: "var(--text-3)" }}>Accueil</Link>
        {" / "}
        <Link href="/profil" className="no-underline" style={{ color: "var(--text-3)" }}>Profil</Link>
        {" / "}
        <span>@{profil.pseudo}</span>
      </div>

      {/* En-tête */}
      <div
        className="flex flex-wrap items-start gap-5 mb-8 p-6 rounded-2xl"
        style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
      >
        {/* Avatar */}
        <div
          className="flex-shrink-0 w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-2xl font-extrabold text-white"
          style={{ background: "var(--red)" }}
        >
          {profil.avatar
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={profil.avatar} alt={profil.pseudo ?? ""} className="w-full h-full object-cover" />
            : initiales
          }
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold mb-0.5" style={{ color: "var(--text)" }}>
            {profil.nom || profil.pseudo}
          </h1>
          <p className="text-sm font-semibold mb-2" style={{ color: "var(--red)" }}>@{profil.pseudo}</p>

          {profil.bio && (
            <p className="text-sm italic mb-2" style={{ color: "var(--text-2)" }}>{profil.bio}</p>
          )}

          <div className="flex flex-wrap gap-4 text-xs" style={{ color: "var(--text-3)" }}>
            {profil.ville && <span>📍 {profil.ville}</span>}
            <span>🎬 {profil.stats.filmsVus} films vus</span>
            <span>⭐ {profil.stats.avis} avis</span>
            <span className="flex items-center gap-2">
              <button
                onClick={() => openFollowModal("followers")}
                className="hover:underline"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "inherit" }}
              >
                <span className="font-bold" style={{ color: "var(--text-2)" }}>{profil.followersCount}</span> abonnés
              </button>
              {" · "}
              <button
                onClick={() => openFollowModal("following")}
                className="hover:underline"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "inherit" }}
              >
                <span className="font-bold" style={{ color: "var(--text-2)" }}>{profil.followingCount}</span> abonnements
              </button>
            </span>
            <span style={{ color: "var(--text-3)" }}>
              Membre depuis {new Date(profil.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex flex-col gap-2 items-end">
          <FollowButton pseudo={profil.pseudo ?? ""} myPseudo={myPseudo} />
          {myPseudo && myPseudo !== profil.pseudo && (
            <Link
              href={`/messages/${profil.pseudo}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm no-underline"
              style={{ background: "var(--bg-3)", color: "var(--text-2)", border: "1px solid var(--border)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Message
            </Link>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="flex overflow-x-auto rounded-xl mb-6" style={{ border: "1px solid var(--border)", scrollbarWidth: "none" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors"
            style={{
              background: activeTab === tab.id ? "var(--red)" : "var(--bg-2)",
              color: activeTab === tab.id ? "white" : "var(--text-2)",
              border: "none", cursor: "pointer",
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: activeTab === tab.id ? "rgba(255,255,255,0.25)" : "var(--bg-3)", color: activeTab === tab.id ? "white" : "var(--text-3)" }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {activeTab === "vitrine" && <VitrineTab profil={profil} posterChoices={posterChoices} />}
      {activeTab === "vus"     && <FilmsVusTab filmsVus={profil.filmsVus} posterChoices={posterChoices} />}
      {activeTab === "avis"    && <AvisTab avis={profil.avis} />}

      {/* Lien comparaison — visible uniquement si connecté et profil différent du sien */}
      {myPseudo && myPseudo !== profil.pseudo && (
        <div className="mt-10 flex justify-center">
          <Link
            href={`/profil/comparer/${profil.pseudo}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium no-underline transition-colors"
            style={{
              background: "var(--bg-3)",
              color: "var(--text-3)",
              border: "1px solid var(--border)",
            }}
          >
            🎬 Comparer nos profils
          </Link>
        </div>
      )}

      {followModal && (
        <FollowListModal
          title={followModal === "followers" ? `Abonnés · ${profil.followersCount}` : `Abonnements · ${profil.followingCount}`}
          users={followList}
          loading={followListLoading}
          onClose={() => setFollowModal(null)}
        />
      )}
    </div>
  );
}
