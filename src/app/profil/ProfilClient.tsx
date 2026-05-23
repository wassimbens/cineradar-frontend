"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  profilApi, authApi, socialApi, messagesApi,
  type Profil, type FilmResume, type FilmFavoriItem,
  type AvisUtilisateur, type FilmVuItem, type AuthUser, type UserSearch,
  type MessageConversation,
} from "@/lib/api";
import FilmPoster from "@/components/FilmPoster";
import PosterPicker from "@/components/PosterPicker";
import ImageCropper from "@/components/ImageCropper";
import ImageViewer from "@/components/ImageViewer";
import FollowListModal from "@/components/FollowListModal";

// ─────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────

function getInitiales(email: string, nom?: string | null) {
  if (nom) {
    const parts = nom.trim().split(" ");
    return (parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : nom.slice(0, 2)
    ).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

// ─────────────────────────────────────────────────────────
//  Composant étoiles
// ─────────────────────────────────────────────────────────

function EtoilesNote({ note, onChange }: { note: number | null; onChange?: (n: number) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? note ?? 0;
  return (
    <div className="flex gap-0.5" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const full = display >= star;
        const half = !full && display >= star - 0.5;
        return (
          <span
            key={star}
            className="cursor-pointer text-xl select-none"
            style={{ color: full || half ? "var(--red)" : "var(--border)" }}
            onMouseMove={(e) => {
              if (!onChange) return;
              const rect = e.currentTarget.getBoundingClientRect();
              setHovered(e.clientX - rect.left < rect.width / 2 ? star - 0.5 : star);
            }}
            onClick={() => onChange && onChange(hovered ?? star)}
          >
            {half ? "½" : "★"}
          </span>
        );
      })}
      {note !== null && (
        <span className="ml-1 text-sm self-center" style={{ color: "var(--text-3)" }}>
          {note}/5
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Formulaire de connexion / inscription
// ─────────────────────────────────────────────────────────

const PSEUDO_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;
const API_URL_AUTH = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

function AuthForm({ onAuth }: { onAuth: (email: string, token: string, user: AuthUser) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [pseudoStatus, setPseudoStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nom, setNom] = useState("");
  const [accepteCgu, setAccepteCgu] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode !== "register" || !pseudo) { setPseudoStatus("idle"); return; }
    if (!PSEUDO_REGEX.test(pseudo)) { setPseudoStatus("invalid"); return; }
    setPseudoStatus("checking");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL_AUTH}/api/auth/check-pseudo?pseudo=${encodeURIComponent(pseudo)}`);
        const data = await res.json();
        setPseudoStatus(data.available ? "available" : "taken");
      } catch {
        setPseudoStatus("idle");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [pseudo, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "register" && password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (mode === "register" && !accepteCgu) {
      setError("Vous devez accepter les CGU et la politique de confidentialité.");
      return;
    }
    if (mode === "register" && (pseudoStatus === "taken" || pseudoStatus === "invalid")) {
      setError("Veuillez choisir un pseudo valide et disponible.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "register") {
        const res = await authApi.register({ email: email.trim(), pseudo: pseudo.trim(), password, nom: nom || undefined });
        onAuth(res.user.email, res.token, res.user);
      } else {
        const res = await authApi.login({ email: email.trim(), password });
        onAuth(res.user.email, res.token, res.user);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur";
      // Si pas de mot de passe, proposer de set-password
      if (msg.includes("incorrect") || msg.includes("mot de passe")) {
        setError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6" style={{ minHeight: "60vh" }}>
      <div
        className="w-full rounded-2xl p-8"
        style={{ maxWidth: 440, background: "var(--bg-2)", border: "1px solid var(--border)" }}
      >
        <div className="text-4xl mb-4 text-center">🎬</div>
        <h1 className="text-2xl font-extrabold mb-1 text-center" style={{ color: "var(--text)" }}>
          {mode === "register" ? "Créer un compte" : "Votre profil CinéRadar"}
        </h1>
        <p className="text-sm mb-6 text-center" style={{ color: "var(--text-3)" }}>
          {mode === "register" ? "Rejoignez la communauté CinéRadar" : "Connectez-vous à votre compte"}
        </p>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg text-sm" style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.fr"
            required
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text)" }}
          />

          {mode === "register" && (
            <>
              <div className="relative">
                <input
                  type="text"
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value)}
                  placeholder="@pseudo (3–20 caractères)"
                  required
                  pattern="[a-zA-Z0-9_-]{3,20}"
                  title="3–20 caractères, lettres, chiffres, _ et -"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none pr-10"
                  style={{
                    background: "var(--bg-3)",
                    border: `1px solid ${pseudoStatus === "available" ? "#16a34a" : pseudoStatus === "taken" || pseudoStatus === "invalid" ? "#dc2626" : "var(--border)"}`,
                    color: "var(--text)",
                  }}
                />
                {pseudoStatus !== "idle" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base select-none">
                    {pseudoStatus === "checking"  && <span style={{ color: "var(--text-3)" }}>…</span>}
                    {pseudoStatus === "available" && <span style={{ color: "#16a34a" }}>✓</span>}
                    {pseudoStatus === "taken"     && <span style={{ color: "#dc2626" }}>✗</span>}
                    {pseudoStatus === "invalid"   && <span style={{ color: "#dc2626" }}>✗</span>}
                  </span>
                )}
              </div>
              {pseudoStatus === "taken"   && <p className="text-xs -mt-1" style={{ color: "#dc2626" }}>Ce pseudo est déjà pris.</p>}
              {pseudoStatus === "invalid" && <p className="text-xs -mt-1" style={{ color: "#dc2626" }}>3–20 caractères, lettres, chiffres, _ et -</p>}
              {pseudoStatus === "available" && <p className="text-xs -mt-1" style={{ color: "#16a34a" }}>Pseudo disponible !</p>}
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Votre nom (optionnel)"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
            </>
          )}

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            required
            minLength={6}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text)" }}
          />

          {mode === "register" && (
            <>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer le mot de passe"
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: "var(--bg-3)",
                  border: `1px solid ${confirmPassword && password !== confirmPassword ? "#dc2626" : "var(--border)"}`,
                  color: "var(--text)",
                }}
              />
              <label className="flex items-start gap-2.5 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={accepteCgu}
                  onChange={(e) => setAccepteCgu(e.target.checked)}
                  className="mt-0.5 flex-shrink-0"
                  style={{ accentColor: "var(--red)", width: 15, height: 15 }}
                />
                <span className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
                  J&apos;accepte les{" "}
                  <a href="/legal/cgu" target="_blank" rel="noopener noreferrer" style={{ color: "var(--red)" }}>
                    conditions générales d&apos;utilisation
                  </a>{" "}
                  et la{" "}
                  <a href="/legal/confidentialite" target="_blank" rel="noopener noreferrer" style={{ color: "var(--red)" }}>
                    politique de confidentialité
                  </a>
                  .
                </span>
              </label>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: "var(--red)", color: "white", opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "…" : mode === "register" ? "Créer le compte →" : "Se connecter →"}
          </button>
        </form>

        {/* Toggles */}
        <div className="mt-4 flex flex-col gap-1 text-center">
          {mode === "login" && (
            <>
              <button onClick={() => { setMode("register"); setError(""); setAccepteCgu(false); }} className="text-xs" style={{ color: "var(--red)", cursor: "pointer" }}>
                Pas encore de compte ? Créer un compte
              </button>
              <a href="/auth/mot-de-passe-oublie" className="text-xs" style={{ color: "var(--text-3)" }}>
                Mot de passe oublié ?
              </a>
            </>
          )}
          {mode === "register" && (
            <button onClick={() => { setMode("login"); setError(""); setConfirmPassword(""); }} className="text-xs" style={{ color: "var(--text-3)", cursor: "pointer" }}>
              Déjà un compte ? Se connecter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Vitrine (4 films favoris showcasés)
// ─────────────────────────────────────────────────────────

function FilmSearchModal({
  onSelect,
  onClose,
}: {
  onSelect: (film: FilmResume) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<FilmResume[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003"}/api/films?q=${encodeURIComponent(q)}&limit=10`
        );
        const data = await res.json();
        const films = Array.isArray(data) ? data : (data.films ?? []);
        setResults(films.slice(0, 10));
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

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
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un film…"
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
          <button onClick={onClose} style={{ color: "var(--text-3)", cursor: "pointer" }}>✕</button>
        </div>
        <div className="overflow-y-auto flex flex-col gap-1">
          {loading && <p className="text-xs text-center py-4" style={{ color: "var(--text-3)" }}>Recherche…</p>}
          {results.map((film) => (
            <button
              key={film.id}
              onClick={() => onSelect(film)}
              className="flex items-center gap-3 p-2 rounded-lg text-left w-full"
              style={{ background: "var(--bg-3)", cursor: "pointer" }}
            >
              <div className="flex-shrink-0 rounded overflow-hidden" style={{ width: 32, height: 48, background: "var(--bg-2)", position: "relative" }}>
                <FilmPoster src={film.affiche} alt={film.titre} fill sizes="32px" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)", textTransform: "uppercase" }}>{film.titre}</p>
                {film.annee && <p className="text-xs" style={{ color: "var(--text-3)" }}>{film.annee}</p>}
              </div>
            </button>
          ))}
          {!loading && q.trim() && results.length === 0 && (
            <p className="text-xs text-center py-4" style={{ color: "var(--text-3)" }}>Aucun résultat</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Nombre de films affichés par "ligne" selon la grille (3 cols mobile, 4 sm, 5 md)
// On affiche 2 lignes par défaut → 10 films (5 cols md) ; step de chargement = 10
const RECENT_INITIAL = 10;
const RECENT_STEP    = 10;

function VitrineTab({ profil, email, isPro, onRefresh, posterChoices, onPickerOpen, startLongPress, cancelLongPress }: {
  profil: Profil; email: string; isPro: boolean; onRefresh: () => void;
  posterChoices: Record<string, string>;
  onPickerOpen: (film: { id: string; titre: string; affiche: string | null }) => void;
  startLongPress: (film: { id: string; titre: string; affiche: string | null }) => void;
  cancelLongPress: () => void;
}) {
  const [addingSlot, setAddingSlot] = useState<number | null>(null);
  const [recentVisible, setRecentVisible] = useState(RECENT_INITIAL);

  const posterFor = (film: { id: string; affiche: string | null }) =>
    posterChoices[film.id] ?? film.affiche;

  // Slots 1-4
  const slots = [1, 2, 3, 4].map((pos) => ({
    pos,
    film: profil.filmsFavoris.find((f) => f.position === pos) ?? null,
  }));

  const handleAdd = async (slot: number, film: FilmResume) => {
    await profilApi.addFavori(email, film.id, slot);
    setAddingSlot(null);
    onRefresh();
  };

  const handleRemove = async (filmId: string) => {
    await profilApi.removeFavori(email, filmId);
    onRefresh();
  };

  // Films vus récents (avec leur note si dispo)
  const avisMap = new Map(profil.avis.map((a) => [a.filmId, a.note]));
  const allRecentFilms = profil.filmsVus;
  const recentFilms = allRecentFilms.slice(0, recentVisible);

  return (
    <div className="flex flex-col gap-8">
      {/* Section vitrine */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>
            🎬 Mes 4 films préférés
          </h2>
          {isPro && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--red)", color: "white" }}>
              ✦ Pro — cliquez sur une affiche pour la personnaliser
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {slots.map(({ pos, film }) => (
            <div key={pos} className="flex flex-col">
              {film ? (
                <div
                  className="group relative rounded-xl overflow-hidden"
                  style={{ aspectRatio: "2/3", background: "var(--bg-3)" }}
                >
                  <Link href={`/films/${film.id}`} className="block w-full h-full" draggable={false}>
                    <FilmPoster src={posterFor(film)} alt={film.titre} fill sizes="(max-width: 640px) 50vw, 200px" />
                  </Link>

                  {/* Bouton changer affiche — desktop clic, mobile long-press */}
                  {isPro && (
                    <button
                      onClick={(e) => { e.preventDefault(); onPickerOpen(film); }}
                      onTouchStart={() => startLongPress(film)}
                      onTouchEnd={cancelLongPress}
                      onTouchCancel={cancelLongPress}
                      title="Changer l'affiche"
                      className="absolute bottom-7 left-1 opacity-70 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: "rgba(0,0,0,0.75)",
                        border: "none",
                        borderRadius: 6,
                        color: "white",
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        padding: "2px 6px",
                        cursor: "pointer",
                        zIndex: 10,
                      }}
                    >
                      ✦ Affiche
                    </button>
                  )}

                  <button
                    onClick={() => handleRemove(film.id)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "var(--red)", color: "white" }}
                    title="Retirer"
                  >
                    ✕
                  </button>
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
                <button
                  onClick={() => setAddingSlot(pos)}
                  className="rounded-xl flex flex-col items-center justify-center gap-1 transition-colors"
                  style={{
                    aspectRatio: "2/3",
                    background: "var(--bg-3)",
                    border: "2px dashed var(--border)",
                    cursor: "pointer",
                    color: "var(--text-3)",
                  }}
                >
                  <span className="text-2xl">+</span>
                  <span className="text-xs">Slot {pos}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Films vus récents */}
      {allRecentFilms.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>
              ✓ Films récemment vus
              <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-3)" }}>
                ({allRecentFilms.length})
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {recentFilms.map((fv) => {
              const note = avisMap.get(fv.film.id) ?? null;
              const date = new Date(fv.dateVu).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
              return (
                <div
                  key={fv.id}
                  className="group rounded-xl overflow-hidden flex flex-col relative"
                  style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
                >
                  <Link href={`/films/${fv.film.id}`} className="no-underline block" draggable={false}>
                    <div className="relative w-full" style={{ aspectRatio: "2/3", background: "var(--bg-3)" }}>
                      <FilmPoster src={posterFor(fv.film)} alt={fv.film.titre} fill sizes="110px" />
                      <div
                        className="absolute bottom-1 left-1 text-xs px-1.5 py-0.5 rounded font-semibold"
                        style={{ background: "rgba(0,0,0,0.72)", color: "#fff" }}
                      >
                        ✓ {date}
                      </div>
                    </div>
                    <div className="p-1.5">
                      <p className="font-semibold leading-snug" style={{ color: "var(--text)", textTransform: "uppercase", fontSize: "clamp(8px, 1.8vw, 11px)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {fv.film.titre}
                      </p>
                      {note !== null && (
                        <p className="text-xs mt-0.5 font-bold" style={{ color: "var(--red)" }}>
                          {"★".repeat(Math.round(note))} {note}/5
                        </p>
                      )}
                    </div>
                  </Link>
                  {/* Bouton changer affiche Pro */}
                  {isPro && (
                    <button
                      onClick={(e) => { e.preventDefault(); onPickerOpen(fv.film); }}
                      onTouchStart={() => startLongPress(fv.film)}
                      onTouchEnd={cancelLongPress}
                      onTouchCancel={cancelLongPress}
                      title="Changer l'affiche"
                      className="absolute top-1 right-1 opacity-70 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: "rgba(0,0,0,0.75)",
                        border: "none",
                        borderRadius: 6,
                        color: "white",
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        padding: "2px 5px",
                        cursor: "pointer",
                        zIndex: 10,
                      }}
                    >
                      ✦
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {/* Voir plus / Voir moins */}
          {allRecentFilms.length > RECENT_INITIAL && (
            <div className="mt-5 text-center">
              {recentVisible < allRecentFilms.length ? (
                <button
                  onClick={() => setRecentVisible((v) => Math.min(v + RECENT_STEP, allRecentFilms.length))}
                  className="px-5 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-2)", cursor: "pointer" }}
                >
                  Voir plus ({allRecentFilms.length - recentVisible} restant{allRecentFilms.length - recentVisible > 1 ? "s" : ""})
                </button>
              ) : (
                <button
                  onClick={() => setRecentVisible(RECENT_INITIAL)}
                  className="px-5 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-3)", cursor: "pointer" }}
                >
                  Réduire ↑
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {addingSlot !== null && (
        <FilmSearchModal
          onSelect={(film) => handleAdd(addingSlot, film)}
          onClose={() => setAddingSlot(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Communauté (recherche + follow)
// ─────────────────────────────────────────────────────────

function UserCard({ user, myPseudo }: { user: UserSearch; myPseudo: string | null }) {
  const [following, setFollowing] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!myPseudo || !user.pseudo) return;
    socialApi.isFollowing(user.pseudo).then((r) => setFollowing(r.following)).catch(() => {});
  }, [myPseudo, user.pseudo]);

  const toggle = async () => {
    if (!myPseudo || !user.pseudo) return;
    setLoading(true);
    try {
      if (following) {
        await socialApi.unfollow(user.pseudo);
        setFollowing(false);
      } else {
        await socialApi.follow(user.pseudo);
        setFollowing(true);
      }
    } finally { setLoading(false); }
  };

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
    >
      <Link href={`/profil/${user.pseudo}`} className="no-underline flex-shrink-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white overflow-hidden"
          style={{ background: "var(--red)" }}
        >
          {user.avatar
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={user.avatar} alt={user.pseudo ?? ""} className="w-full h-full object-cover" />
            : (user.nom ?? user.pseudo ?? "?").slice(0, 2).toUpperCase()
          }
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/profil/${user.pseudo}`} className="no-underline">
          <p className="text-sm font-bold" style={{ color: "var(--text)" }}>@{user.pseudo}</p>
        </Link>
        {user.nom && <p className="text-xs" style={{ color: "var(--text-2)" }}>{user.nom}</p>}
        <p className="text-xs" style={{ color: "var(--text-3)" }}>
          {user._count?.filmsVus ?? 0} films vus · {user._count?.avis ?? 0} avis
        </p>
      </div>
      {myPseudo && user.pseudo !== myPseudo && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Link
            href={`/messages/${user.pseudo}`}
            className="flex items-center justify-center w-8 h-8 rounded-full no-underline"
            style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text-2)" }}
            title="Envoyer un message"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </Link>
          <button
            onClick={toggle}
            disabled={loading || following === null}
            className="text-xs px-3 py-1.5 rounded-full font-semibold"
            style={{
              background: following ? "var(--bg-3)" : "var(--red)",
              color: following ? "var(--text-2)" : "white",
              border: following ? "1px solid var(--border)" : "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {following ? "Suivi ✓" : "Suivre"}
          </button>
        </div>
      )}
    </div>
  );
}

function CommunauteTab({ pseudo }: { pseudo: string | null }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<UserSearch[]>([]);
  const [searching, setSearching] = useState(false);
  const [following, setFollowing] = useState<UserSearch[]>([]);
  const [followers, setFollowers] = useState<UserSearch[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  useEffect(() => {
    if (!pseudo) return;
    setLoadingLists(true);
    Promise.all([
      socialApi.getFollowing(pseudo).catch(() => []),
      socialApi.getFollowers(pseudo).catch(() => []),
    ]).then(([f1, f2]) => { setFollowing(f1); setFollowers(f2); }).finally(() => setLoadingLists(false));
  }, [pseudo]);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try { setResults(await socialApi.searchUsers(q)); }
      catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  if (!pseudo) {
    return (
      <div className="text-center py-16">
        <p className="text-3xl mb-3">👥</p>
        <p className="font-semibold" style={{ color: "var(--text)" }}>Choisissez un pseudo</p>
        <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
          Définissez votre pseudo dans votre profil pour accéder à la communauté.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Barre de recherche */}
      <div>
        <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>🔍 Trouver des cinéphiles</h2>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Chercher par pseudo ou nom…"
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text)" }}
        />
        {searching && <p className="text-xs mt-2" style={{ color: "var(--text-3)" }}>Recherche…</p>}
        {results.length > 0 && (
          <div className="flex flex-col gap-2 mt-3">
            {results.map((u) => <UserCard key={u.id} user={u} myPseudo={pseudo} />)}
          </div>
        )}
      </div>

      {/* Listes follow */}
      {loadingLists ? (
        <p className="text-xs" style={{ color: "var(--text-3)" }}>Chargement…</p>
      ) : (
        <>
          {following.length > 0 && (
            <div>
              <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>
                👤 Abonnements ({following.length})
              </h2>
              <div className="flex flex-col gap-2">
                {following.map((u) => <UserCard key={u.id} user={u} myPseudo={pseudo} />)}
              </div>
            </div>
          )}
          {followers.length > 0 && (
            <div>
              <h2 className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>
                👥 Abonnés ({followers.length})
              </h2>
              <div className="flex flex-col gap-2">
                {followers.map((u) => <UserCard key={u.id} user={u} myPseudo={pseudo} />)}
              </div>
            </div>
          )}
          {following.length === 0 && followers.length === 0 && !q && (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">👥</p>
              <p className="text-sm" style={{ color: "var(--text-3)" }}>
                Cherchez des utilisateurs pour les suivre.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Mini FilmCard
// ─────────────────────────────────────────────────────────

function FilmCard({ film, onRemove, badge, posterSrc, onPickerOpen }: {
  film: FilmResume; onRemove?: () => void; badge?: React.ReactNode;
  posterSrc?: string | null;
  onPickerOpen?: (film: { id: string; titre: string; affiche: string | null }) => void;
}) {
  const src = posterSrc !== undefined ? posterSrc : film.affiche;
  return (
    <div className="group relative flex flex-col rounded-xl overflow-hidden" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
      <Link href={`/films/${film.id}`} className="no-underline block">
        <div className="relative w-full" style={{ aspectRatio: "2/3", background: "var(--bg-3)" }}>
          <FilmPoster src={src} alt={film.titre} fill sizes="(max-width: 640px) 50vw, 160px" />
        </div>
        <div className="p-2">
          <p className="text-xs font-semibold leading-snug truncate" style={{ color: "var(--text)", textTransform: "uppercase" }}>{film.titre}</p>
          {film.annee && <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{film.annee}</p>}
          {badge}
        </div>
      </Link>
      {onRemove && (
        <button
          onClick={(e) => { e.preventDefault(); onRemove(); }}
          className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "var(--red)", color: "white" }}
        >✕</button>
      )}
      {onPickerOpen && (
        <button
          onClick={(e) => { e.preventDefault(); onPickerOpen(film); }}
          title="Changer l'affiche"
          className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: "rgba(0,0,0,0.70)", border: "none", borderRadius: 5,
            color: "white", fontSize: "0.65rem", fontWeight: 700,
            padding: "2px 5px", cursor: "pointer", zIndex: 10,
            lineHeight: 1,
          }}
        >
          ✦
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  AvisCard
// ─────────────────────────────────────────────────────────

function AvisCard({ avis, onDelete, posterSrc, onPickerOpen }: {
  avis: AvisUtilisateur; onDelete: () => void;
  posterSrc?: string | null;
  onPickerOpen?: (film: { id: string; titre: string; affiche: string | null }) => void;
}) {
  if (!avis) return null;
  const film = avis.film ?? null;
  let date = "";
  try { date = new Date(avis.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }); } catch { }
  const src = posterSrc !== undefined ? posterSrc : (film?.affiche ?? null);
  return (
    <div className="flex gap-3 p-3 rounded-xl group relative" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
      <Link href={`/films/${avis.filmId}`} className="no-underline flex-shrink-0">
        <div className="rounded-lg overflow-hidden" style={{ width: 48, height: 72, background: "var(--bg-3)", position: "relative" }}>
          <FilmPoster src={src} alt={film?.titre ?? ""} fill sizes="48px" />
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/films/${avis.filmId}`} className="no-underline">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text)", textTransform: "uppercase" }}>{film?.titre ?? "Film inconnu"}</p>
        </Link>
        {film?.annee && <p className="text-xs" style={{ color: "var(--text-3)" }}>{film.annee}</p>}
        <EtoilesNote note={avis.note} />
        {avis.texte && <p className="text-xs mt-1 italic line-clamp-2" style={{ color: "var(--text-2)" }}>&laquo;&nbsp;{avis.texte}&nbsp;&raquo;</p>}
        {date && <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{date}</p>}
      </div>
      <div className="flex flex-col gap-1 flex-shrink-0 self-start">
        {onPickerOpen && film && (
          <button
            onClick={() => onPickerOpen({ id: avis.filmId, titre: film.titre, affiche: film.affiche ?? null })}
            title="Changer l'affiche"
            className="text-xs px-1.5 py-0.5 rounded opacity-70 group-hover:opacity-100 transition-opacity"
            style={{ background: "rgba(0,0,0,0.55)", color: "white", fontSize: "0.6rem", fontWeight: 700, cursor: "pointer", border: "none" }}
          >
            ✦
          </button>
        )}
        <button onClick={onDelete} className="text-xs px-2 py-1 rounded" style={{ color: "var(--text-3)", cursor: "pointer" }}>🗑</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  FilmVuCard
// ─────────────────────────────────────────────────────────

function FilmVuCard({ fv, onRemove, posterSrc, onPickerOpen }: {
  fv: FilmVuItem; onRemove: () => void;
  posterSrc?: string | null;
  onPickerOpen?: (film: { id: string; titre: string; affiche: string | null }) => void;
}) {
  const date = new Date(fv.dateVu).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const src = posterSrc !== undefined ? posterSrc : fv.film.affiche;
  return (
    <div className="group relative flex flex-col rounded-xl overflow-hidden" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
      <Link href={`/films/${fv.film.id}`} className="no-underline block">
        <div className="relative w-full" style={{ aspectRatio: "2/3", background: "var(--bg-3)" }}>
          <FilmPoster src={src} alt={fv.film.titre} fill sizes="130px" />
          <div className="absolute bottom-1 left-1 text-xs px-1.5 py-0.5 rounded font-semibold" style={{ background: "rgba(0,0,0,0.72)", color: "#fff" }}>
            ✓ {date}
          </div>
        </div>
        <div className="p-2">
          <p className="text-xs font-semibold leading-snug truncate" style={{ color: "var(--text)", textTransform: "uppercase" }}>{fv.film.titre}</p>
          {fv.film.annee && <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{fv.film.annee}</p>}
        </div>
      </Link>
      <button onClick={(e) => { e.preventDefault(); onRemove(); }} className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "var(--red)", color: "white" }}>✕</button>
      {onPickerOpen && (
        <button
          onClick={(e) => { e.preventDefault(); onPickerOpen(fv.film); }}
          title="Changer l'affiche"
          className="absolute top-1 left-1 opacity-70 group-hover:opacity-100 transition-opacity"
          style={{
            background: "rgba(0,0,0,0.75)", border: "none", borderRadius: 6,
            color: "white", fontSize: "0.6rem", fontWeight: 700,
            padding: "2px 5px", cursor: "pointer", zIndex: 10,
          }}
        >
          ✦
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Stats
// ─────────────────────────────────────────────────────────

function GenreBar({ genre, count, max }: { genre: string; count: number; max: number }) {
  const pct = Math.round((count / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-28 text-right flex-shrink-0" style={{ color: "var(--text-2)" }}>{genre}</span>
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, background: "var(--bg-3)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--red)" }} />
      </div>
      <span className="text-xs w-8 flex-shrink-0" style={{ color: "var(--text-3)" }}>{count}</span>
    </div>
  );
}

// ── Stats simples (onglet free) ───────────────────────────

function SimpleStatsSection({ profil }: { profil: Profil }) {
  const maxGenre = profil.genresStats[0]?.count ?? 1;
  if (profil.stats.filmsVus === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-3xl mb-2">📊</p>
        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Aucune statistique disponible</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Marquez des films comme vus pour voir vos préférences.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Films vus", val: profil.stats.filmsVus, icon: "🎬" },
          { label: "Favoris", val: profil.stats.favoris, icon: "❤️" },
          { label: "Watchlist", val: profil.stats.watchlist, icon: "🔖" },
          { label: "Avis", val: profil.stats.avis, icon: "⭐" },
        ].map(({ label, val, icon }) => (
          <div key={label} className="flex flex-col items-center p-4 rounded-xl" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
            <span className="text-2xl mb-1">{icon}</span>
            <span className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>{val}</span>
            <span className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{label}</span>
          </div>
        ))}
      </div>
      {profil.genresStats.length > 0 && (
        <div>
          <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>Genres favoris</h3>
          <div className="flex flex-col gap-2">
            {profil.genresStats.slice(0, 5).map(({ genre, count }) => <GenreBar key={genre} genre={genre} count={count} max={maxGenre} />)}
          </div>
        </div>
      )}
      {profil.realisateursStats.length > 0 && (
        <div>
          <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>Réalisateurs vus</h3>
          <div className="flex flex-wrap gap-2">
            {profil.realisateursStats.slice(0, 8).map(({ realisateur, count }) => (
              <span key={realisateur} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: "var(--bg-3)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                {realisateur} <span className="ml-1.5 font-bold" style={{ color: "var(--text-3)" }}>{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── CinéScope Pro (onglet enrichi) ────────────────────────

const CINESCOPE_API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

function CineScopeSection({ profil, email }: { profil: Profil; email: string }) {
  const [downloading, setDownloading] = useState(false);
  const maxGenre = profil.genresStats[0]?.count ?? 1;

  // Note moyenne
  const notesValides = profil.avis.map(a => (a as { note?: number | null }).note).filter((n): n is number => n != null && n > 0);
  const noteMoyenne = notesValides.length > 0 ? (notesValides.reduce((s, n) => s + n, 0) / notesValides.length) : null;

  // Distribution des notes
  const distrib: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  notesValides.forEach(n => { const k = Math.round(n); if (k >= 1 && k <= 5) distrib[k]++; });
  const maxDistrib = Math.max(...Object.values(distrib), 1);

  // Films vus par mois (12 derniers mois)
  const filmsByMonth: Record<string, number> = {};
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    filmsByMonth[key] = 0;
  }
  profil.filmsVus.forEach(fv => {
    const d = new Date(fv.dateVu);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in filmsByMonth) filmsByMonth[key]++;
  });
  const maxMonth = Math.max(...Object.values(filmsByMonth), 1);
  const moisLabels: Record<string, string> = { "01": "Jan", "02": "Fév", "03": "Mar", "04": "Avr", "05": "Mai", "06": "Jun", "07": "Jul", "08": "Aoû", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Déc" };

  // Décennies
  const decadeCount = new Map<string, number>();
  profil.filmsVus.forEach(fv => {
    if (!fv.film.annee) return;
    const decade = `${Math.floor(fv.film.annee / 10) * 10}s`;
    decadeCount.set(decade, (decadeCount.get(decade) ?? 0) + 1);
  });
  const decades = [...decadeCount.entries()].sort((a, b) => b[1] - a[1]);
  const maxDecade = decades[0]?.[1] ?? 1;

  // Temps total estimé (1h45 moyenne par film)
  const totalMinutes = profil.stats.filmsVus * 105;
  const totalHeures = Math.floor(totalMinutes / 60);
  const joursEquivalent = (totalMinutes / 60 / 24).toFixed(1);

  // Export .ics
  const handleCalendarDownload = async () => {
    setDownloading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("cineradar_token") : null;
      const res = await fetch(`${CINESCOPE_API}/api/profil/${encodeURIComponent(email)}/calendar`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Erreur");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cineradar.ics";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silencieux
    } finally {
      setDownloading(false);
    }
  };

  if (profil.stats.filmsVus === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-3xl mb-2">🔭</p>
        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>CinéScope vide pour l&apos;instant</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Marquez des films comme vus pour voir votre tableau de bord.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Bouton export calendrier */}
      <div className="flex justify-end">
        <button
          onClick={handleCalendarDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-2)", cursor: downloading ? "not-allowed" : "pointer", opacity: downloading ? 0.7 : 1 }}
        >
          <span>📅</span>
          <span>{downloading ? "Génération…" : "Exporter en calendrier (.ics)"}</span>
        </button>
      </div>

      {/* Compteurs + temps total */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Films vus", val: profil.stats.filmsVus, icon: "🎬" },
          { label: "Temps estimé", val: `${totalHeures}h`, sub: `≈ ${joursEquivalent} jours`, icon: "⏱️" },
          { label: "Favoris", val: profil.stats.favoris, icon: "❤️" },
          { label: "Avis rédigés", val: profil.stats.avis, icon: "⭐" },
        ].map(({ label, val, icon, sub }) => (
          <div key={label} className="flex flex-col items-center p-4 rounded-xl" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
            <span className="text-2xl mb-1">{icon}</span>
            <span className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>{val}</span>
            {sub && <span className="text-xs mt-0.5" style={{ color: "var(--red)" }}>{sub}</span>}
            <span className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Note moyenne + distribution */}
      {notesValides.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="p-4 rounded-xl" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
            <h3 className="text-sm font-bold mb-2" style={{ color: "var(--text)" }}>Note moyenne donnée</h3>
            <p className="text-3xl font-extrabold" style={{ color: "var(--red)" }}>
              {noteMoyenne!.toFixed(1)}<span className="text-base font-normal" style={{ color: "var(--text-3)" }}>/5</span>
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Sur {notesValides.length} film{notesValides.length > 1 ? "s" : ""} noté{notesValides.length > 1 ? "s" : ""}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>Distribution des notes</h3>
            <div className="flex flex-col gap-1.5">
              {[5, 4, 3, 2, 1].map(star => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs w-6 text-right flex-shrink-0" style={{ color: "var(--text-3)" }}>{star}★</span>
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: "var(--bg-3)" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.round((distrib[star] / maxDistrib) * 100)}%`, background: "var(--red)" }} />
                  </div>
                  <span className="text-xs w-5 flex-shrink-0" style={{ color: "var(--text-3)" }}>{distrib[star]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Films vus par mois (12 mois) */}
      <div>
        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>Films vus — 12 derniers mois</h3>
        <div className="flex items-end gap-1" style={{ height: 80 }}>
          {Object.entries(filmsByMonth).map(([key, count]) => {
            const month = key.split("-")[1];
            const pct = Math.round((count / maxMonth) * 100);
            return (
              <div key={key} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold" style={{ color: count > 0 ? "var(--red)" : "transparent", fontSize: "0.6rem" }}>{count || "·"}</span>
                <div className="w-full rounded-t" style={{ height: `${Math.max(pct, 4)}%`, background: count > 0 ? "var(--red)" : "var(--bg-3)", minHeight: 4 }} />
                <span style={{ color: "var(--text-3)", fontSize: "0.55rem" }}>{moisLabels[month]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Décennies */}
      {decades.length > 0 && (
        <div>
          <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>Époques préférées</h3>
          <div className="flex flex-col gap-2">
            {decades.map(([decade, count]) => (
              <div key={decade} className="flex items-center gap-3">
                <span className="text-xs font-bold w-12 flex-shrink-0" style={{ color: "var(--text-2)" }}>{decade}</span>
                <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, background: "var(--bg-3)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.round((count / maxDecade) * 100)}%`, background: "var(--red)", opacity: 0.85 }} />
                </div>
                <span className="text-xs w-5 text-right flex-shrink-0" style={{ color: "var(--text-3)" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Genres */}
      {profil.genresStats.length > 0 && (
        <div>
          <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>Genres favoris</h3>
          <div className="flex flex-col gap-2">
            {profil.genresStats.map(({ genre, count }) => <GenreBar key={genre} genre={genre} count={count} max={maxGenre} />)}
          </div>
        </div>
      )}

      {/* Réalisateurs */}
      {profil.realisateursStats.length > 0 && (
        <div>
          <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>Réalisateurs vus</h3>
          <div className="flex flex-wrap gap-2">
            {profil.realisateursStats.map(({ realisateur, count }) => (
              <span key={realisateur} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: "var(--bg-3)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                {realisateur} <span className="ml-1.5 font-bold" style={{ color: "var(--text-3)" }}>{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  EmptyState
// ─────────────────────────────────────────────────────────

function EmptyState({ icon, titre, texte }: { icon: string; titre: string; texte: string }) {
  return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>{titre}</p>
      <p className="text-sm" style={{ color: "var(--text-3)" }}>{texte}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Composant principal
// ─────────────────────────────────────────────────────────

function resizeImage(file: File, size = 120): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new window.Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        const minSide = Math.min(img.naturalWidth, img.naturalHeight);
        ctx.drawImage(img, (img.naturalWidth - minSide) / 2, (img.naturalHeight - minSide) / 2, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────────────────
//  Banner : email non vérifié
// ─────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function EmailVerifBanner({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const resend = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("cineradar_token");
      await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3 mb-6 text-sm"
      style={{ background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e" }}
    >
      <span className="text-xl">📧</span>
      <div className="flex-1">
        <strong>Confirmez votre email</strong> — Un email a été envoyé à <strong>{email}</strong>.
        Cliquez sur le lien pour activer toutes les fonctionnalités.
      </div>
      {!sent ? (
        <button
          onClick={resend}
          disabled={loading}
          className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0"
          style={{ background: "#92400e", color: "#fff", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "…" : "Renvoyer"}
        </button>
      ) : (
        <span className="text-xs font-bold" style={{ color: "#065f46" }}>✓ Email renvoyé !</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Recommandations personnalisées (Pro)
// ─────────────────────────────────────────────────────────

interface FilmReco {
  id: string;
  titre: string;
  titreOriginal: string | null;
  affiche: string | null;
  annee: number | null;
  realisateur: string | null;
  genres: string[];
  imdbNote: number | null;
  synopsis: string | null;
}

const RECO_API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

function RecommandationsSection({ email }: { email: string }) {
  const [films, setFilms] = useState<FilmReco[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("cineradar_token") : null;
    fetch(`${RECO_API}/api/profil/${encodeURIComponent(email)}/recommandations`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setFilms(data);
        else setError(data.error ?? "Erreur");
      })
      .catch(() => setError("Erreur réseau"))
      .finally(() => setLoading(false));
  }, [email]);

  if (loading) return <div className="flex justify-center py-20"><p style={{ color: "var(--text-3)" }}>Chargement…</p></div>;

  if (error) return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">😕</p>
      <p style={{ color: "var(--text-3)" }}>{error}</p>
    </div>
  );

  if (films.length === 0) return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">🎬</p>
      <p className="font-bold mb-1" style={{ color: "var(--text)" }}>Pas encore de recommandations</p>
      <p className="text-sm" style={{ color: "var(--text-3)" }}>Marquez plus de films comme vus pour affiner vos goûts.</p>
    </div>
  );

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: "var(--text-3)" }}>
        Sélectionnés selon vos genres et réalisateurs préférés · {films.length} films
      </p>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
        {films.map((film) => (
          <Link key={film.id} href={`/films/${film.id}`} className="group block no-underline">
            <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
              <div style={{ aspectRatio: "2/3", background: "var(--bg-3)", position: "relative", overflow: "hidden" }}>
                {film.affiche
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={film.affiche} alt={film.titre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div className="flex items-center justify-center w-full h-full text-3xl">🎬</div>
                }
                {film.imdbNote && film.imdbNote >= 7 && (
                  <span className="absolute top-1 right-1 text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: "#f5c518", color: "#000" }}>
                    ★ {film.imdbNote.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{film.titre}</p>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>{film.annee ?? "—"}</p>
                {film.genres.slice(0, 2).map((g) => (
                  <span key={g} className="inline-block text-xs mr-1 mt-0.5 px-1 rounded" style={{ background: "var(--bg-3)", color: "var(--text-3)", fontSize: "0.65rem" }}>{g}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

type Tab = "vitrine" | "simple-stats" | "stats" | "pour-vous" | "listes" | "favoris" | "watchlist" | "vus" | "avis" | "cinemas" | "communaute" | "notifications" | "messages";

// ─────────────────────────────────────────────────────────
//  Onglet Mes listes
// ─────────────────────────────────────────────────────────

interface ListeResume {
  id: string;
  slug: string;
  titre: string;
  description?: string | null;
  emoji: string | null;
  coverImage?: string | null;
  thumbnail?: string | null;
  isPublic: boolean;
  _count: { films: number; membres: number };
  updatedAt: string;
}

const API_URL_PROFIL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

function MesListesSection({ token, onReconnect }: { token: string | null; onReconnect: () => void }) {
  const [listes, setListes] = useState<ListeResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitre, setNewTitre] = useState("");
  const [newEmoji, setNewEmoji] = useState("🎬");
  const [newCoverImage, setNewCoverImage] = useState("");
  const [newPublic, setNewPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingListeImage, setViewingListeImage] = useState<string | null>(null);
  const listeLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchListes = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`${API_URL_PROFIL}/api/listes/mes-listes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setListes(await res.json());
      } else if (res.status === 401) {
        setFetchError("session");
      } else {
        setFetchError("api");
      }
    } catch {
      setFetchError("network");
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchListes(); }, [fetchListes]);

  const handleCreate = async () => {
    if (!token || !newTitre.trim()) return;
    setError(null);
    try {
      const res = await fetch(`${API_URL_PROFIL}/api/listes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ titre: newTitre.trim(), emoji: newEmoji, isPublic: newPublic, coverImage: newCoverImage.trim() || null }),
      });
      if (res.ok) {
        setNewTitre("");
        setNewCoverImage("");
        setCreating(false);
        await fetchListes();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Erreur création");
      }
    } catch { setError("Erreur réseau"); }
  };

  const handleDelete = async (slug: string) => {
    if (!token || !confirm("Supprimer cette liste ?")) return;
    await fetch(`${API_URL_PROFIL}/api/listes/${slug}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchListes();
  };

  if (!token) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-3xl mb-3">🔐</p>
        <p className="font-semibold mb-2" style={{ color: "var(--text)" }}>Reconnexion requise</p>
        <p className="text-sm mb-5" style={{ color: "var(--text-3)", maxWidth: 300, margin: "0 auto 1.25rem" }}>
          Pour accéder à vos listes, veuillez vous reconnecter avec votre compte.
        </p>
        <button
          onClick={onReconnect}
          className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white"
          style={{ background: "var(--red)", border: "none", cursor: "pointer" }}
        >
          Se reconnecter
        </button>
      </div>
    );
  }

  if (fetchError === "session") {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-3xl mb-3">🔑</p>
        <p className="font-semibold mb-2" style={{ color: "var(--text)" }}>Session expirée</p>
        <p className="text-sm mb-5" style={{ color: "var(--text-3)" }}>Reconnectez-vous pour accéder à vos listes.</p>
        <button onClick={onReconnect} className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white" style={{ background: "var(--red)", border: "none", cursor: "pointer" }}>
          Se reconnecter
        </button>
      </div>
    );
  }

  if (fetchError === "network" || fetchError === "api") {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-3xl mb-3">⚡</p>
        <p className="font-semibold mb-2" style={{ color: "var(--text)" }}>Serveur temporairement indisponible</p>
        <p className="text-sm mb-5" style={{ color: "var(--text-3)" }}>Réessayez dans quelques instants.</p>
        <button onClick={() => fetchListes()} className="text-sm font-semibold px-5 py-2.5 rounded-xl" style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text-2)", cursor: "pointer" }}>
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* En-tête + bouton créer */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-extrabold" style={{ color: "var(--text)" }}>Mes listes</h2>
        <button
          onClick={() => setCreating((v) => !v)}
          className="text-sm font-semibold px-3 py-1.5 rounded-lg"
          style={{ background: "var(--red)", color: "white", border: "none", cursor: "pointer" }}
        >
          {creating ? "Annuler" : "+ Nouvelle liste"}
        </button>
      </div>

      {/* Formulaire création */}
      {creating && (
        <div
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <div className="flex gap-2">
            <input
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value.slice(0, 4))}
              className="w-12 text-center rounded-lg px-2 py-2 outline-none text-lg"
              style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder="🎬"
            />
            <input
              value={newTitre}
              onChange={(e) => setNewTitre(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Nom de la liste…"
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text)" }}
              autoFocus
            />
          </div>
          {/* Photo de couverture */}
          {newCoverImage ? (
            <div className="relative rounded-lg overflow-hidden" style={{ height: 90 }}>
              <img src={newCoverImage} alt="Couverture" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button
                onClick={() => setNewCoverImage("")}
                className="absolute top-1.5 right-1.5 rounded-full px-2 py-0.5 text-xs font-bold"
                style={{ background: "rgba(0,0,0,0.55)", color: "white", border: "none", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
          ) : (
            <label
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer"
              style={{ background: "var(--bg-3)", border: "1px dashed var(--border)", color: "var(--text-3)" }}
            >
              📷 Choisir une photo de couverture
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const img = new window.Image();
                    img.onload = () => {
                      const MAX = 900;
                      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
                      const w = Math.round(img.width * scale);
                      const h = Math.round(img.height * scale);
                      const canvas = document.createElement("canvas");
                      canvas.width = w;
                      canvas.height = h;
                      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
                      setNewCoverImage(canvas.toDataURL("image/jpeg", 0.78));
                    };
                    img.src = ev.target?.result as string;
                  };
                  reader.readAsDataURL(file);
                  e.target.value = "";
                }}
              />
            </label>
          )}
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--text-2)" }}>
            <input
              type="checkbox"
              checked={newPublic}
              onChange={(e) => setNewPublic(e.target.checked)}
              className="rounded"
            />
            Liste publique
          </label>
          {error && <p className="text-xs" style={{ color: "var(--red)" }}>{error}</p>}
          <button
            onClick={handleCreate}
            disabled={!newTitre.trim()}
            className="self-start px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--red)", cursor: newTitre.trim() ? "pointer" : "not-allowed", opacity: newTitre.trim() ? 1 : 0.5 }}
          >
            Créer
          </button>
        </div>
      )}

      {/* Contenu */}
      {loading ? (
        <div className="text-sm" style={{ color: "var(--text-3)" }}>Chargement…</div>
      ) : listes.length === 0 ? (
        <EmptyState icon="📋" titre="Aucune liste" texte="Créez votre première liste pour organiser vos films." />
      ) : (
        <div className="flex flex-col gap-2">
          {listes.map((liste) => (
            <div
              key={liste.id}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
            >
              <div
                className="flex-shrink-0 flex items-center justify-center overflow-hidden"
                style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--bg-3)", border: "1px solid var(--border)", cursor: liste.thumbnail ? "zoom-in" : "default" }}
                onContextMenu={(e) => { e.preventDefault(); if (liste.thumbnail) setViewingListeImage(liste.thumbnail); }}
                onMouseDown={() => { if (liste.thumbnail) listeLongPressTimer.current = setTimeout(() => setViewingListeImage(liste.thumbnail!), 600); }}
                onMouseUp={() => { if (listeLongPressTimer.current) { clearTimeout(listeLongPressTimer.current); listeLongPressTimer.current = null; } }}
                onMouseLeave={() => { if (listeLongPressTimer.current) { clearTimeout(listeLongPressTimer.current); listeLongPressTimer.current = null; } }}
                onTouchStart={() => { if (liste.thumbnail) listeLongPressTimer.current = setTimeout(() => setViewingListeImage(liste.thumbnail!), 600); }}
                onTouchEnd={() => { if (listeLongPressTimer.current) { clearTimeout(listeLongPressTimer.current); listeLongPressTimer.current = null; } }}
              >
                {liste.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={liste.thumbnail} alt={liste.titre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span className="text-2xl">{liste.emoji ?? "🎬"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <a
                  href={`/listes/${liste.slug}`}
                  className="font-semibold text-sm no-underline hover:underline truncate block"
                  style={{ color: "var(--text)" }}
                >
                  {liste.titre}
                </a>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                  {liste._count.films} film{liste._count.films !== 1 ? "s" : ""} · {liste.isPublic ? "Publique" : "Privée"}
                  {liste._count.membres > 0 && ` · ${liste._count.membres} membre${liste._count.membres !== 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={`/listes/${liste.slug}`}
                  className="text-xs px-2 py-1 rounded-lg no-underline"
                  style={{ color: "var(--text-2)", border: "1px solid var(--border)", background: "var(--bg-3)" }}
                >
                  Voir →
                </a>
                <button
                  onClick={() => handleDelete(liste.slug)}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ color: "var(--text-3)", border: "1px solid var(--border)", background: "var(--bg-3)", cursor: "pointer" }}
                  title="Supprimer"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingListeImage && (
        <ImageViewer src={viewingListeImage} onClose={() => setViewingListeImage(null)} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Composant Notifications
// ─────────────────────────────────────────────────────────

interface NotifItem {
  id: string; type: string; titre: string; corps: string | null;
  lu: boolean; lien: string | null; imageUrl: string | null; createdAt: string;
}

function NotificationsTab({ token, onUnreadChange }: { token: string | null; onUnreadChange: (n: number) => void }) {
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const PAPI = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

  const load = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${PAPI}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json() as { notifications: NotifItem[]; unread: number };
        setNotifs(data.notifications);
        onUnreadChange(data.unread);
      }
    } finally { setLoading(false); }
  }, [token, PAPI, onUnreadChange]);

  useEffect(() => { load(); }, [load]);

  // Trigger vérification films-en-salle au chargement
  useEffect(() => {
    if (!token) return;
    fetch(`${PAPI}/api/notifications/trigger/films-en-salle`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, credentials: "include",
    }).then(() => load()).catch(() => {});
  }, [token, PAPI, load]);

  const markAllRead = async () => {
    if (!token) return;
    await fetch(`${PAPI}/api/notifications/read-all`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}` }, credentials: "include",
    });
    setNotifs(prev => prev.map(n => ({ ...n, lu: true })));
    onUnreadChange(0);
  };

  const markRead = (id: string) => {
    if (!token) return;
    // Mise à jour optimiste immédiate (avant navigation)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
    onUnreadChange(notifs.filter(n => !n.lu && n.id !== id).length);
    // API en arrière-plan
    fetch(`${PAPI}/api/notifications/${id}/read`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}` }, credentials: "include",
    }).catch(() => {});
  };

  const deleteNotif = async (id: string) => {
    if (!token) return;
    await fetch(`${PAPI}/api/notifications/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` }, credentials: "include",
    });
    setNotifs(prev => prev.filter(n => n.id !== id));
  };

  const typeIcon: Record<string, string> = {
    follow: "👤",
    message: "💬",
    film_en_salle: "🎬",
    nouveaute_hebdo: "🌟",
  };

  // Hooks toujours appelés avant tout return conditionnel
  // Extrait le pseudo depuis /profil/X ou /messages/X → clé normalisée
  const normalizeLienKey = (lien: string) => {
    const m = lien.match(/^\/(?:profil|messages)\/(.+)$/);
    return m ? m[1] : lien;
  };

  // Pour chaque utilisateur, garder l'avatar le plus récent (normalisé par pseudo, pas par lien)
  const latestAvatarByLien = useMemo(() => {
    const map: Record<string, string | null> = {};
    const dateMap: Record<string, string> = {};
    for (const n of notifs) {
      if ((n.type === "follow" || n.type === "message") && n.lien) {
        const key = normalizeLienKey(n.lien);
        if (!dateMap[key] || n.createdAt > dateMap[key]) {
          map[key] = n.imageUrl;
          dateMap[key] = n.createdAt;
        }
      }
    }
    return map;
  }, [notifs]);

  if (loading) return (
    <div className="flex flex-col gap-3">
      {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }} />)}
    </div>
  );

  if (notifs.length === 0) return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">🔔</p>
      <p className="font-semibold" style={{ color: "var(--text)" }}>Vous n&apos;avez plus de notifications !</p>
      <p className="text-sm mt-2" style={{ color: "var(--text-3)" }}>
        Vous serez notifié quand quelqu&apos;un vous suit ou quand un film de vos favoris est à l&apos;affiche.
      </p>
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          {notifs.filter(n => !n.lu).length > 0
            ? `${notifs.filter(n => !n.lu).length} non lue${notifs.filter(n => !n.lu).length > 1 ? "s" : ""}`
            : "Tout lu"}
        </p>
        {notifs.some(n => !n.lu) && (
          <button onClick={markAllRead} className="text-xs"
            style={{ color: "var(--red)", cursor: "pointer", background: "none", border: "none" }}>
            Tout marquer comme lu
          </button>
        )}
      </div>

      {notifs.map(notif => {
        // Utiliser l'avatar le plus récent pour les notifs sociales (follow/message)
        // On normalise la clé (/profil/X et /messages/X → même utilisateur X)
        const displayImage = (notif.type === "follow" || notif.type === "message") && notif.lien
          ? (latestAvatarByLien[normalizeLienKey(notif.lien)] ?? notif.imageUrl)
          : notif.imageUrl;

        const cardContent = (
          <>
            {/* Image / icône */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
              style={{ background: "var(--bg-3)", fontSize: "1.3rem" }}>
              {displayImage
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={displayImage} alt="" className="w-full h-full object-cover" />
                : <span>{typeIcon[notif.type] ?? "🔔"}</span>
              }
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{notif.titre}</p>
              {notif.corps && (
                <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{notif.corps}</p>
              )}
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
                {new Date(notif.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </>
        );

        return (
          <div key={notif.id} className="flex items-start gap-3 rounded-xl overflow-hidden"
            style={{ background: notif.lu ? "var(--bg-2)" : "var(--bg-3)", border: `1px solid ${notif.lu ? "var(--border)" : "var(--red)"}`, opacity: notif.lu ? 0.8 : 1 }}>

            {/* Zone cliquable (toute la carte sauf les boutons d'action) */}
            {notif.lien ? (
              <Link href={notif.lien.replace(/^\/profils\//, "/profil/")} className="flex items-start gap-3 p-3 flex-1 min-w-0 no-underline"
                onClick={() => markRead(notif.id)}>
                {cardContent}
              </Link>
            ) : (
              <div className="flex items-start gap-3 p-3 flex-1 min-w-0">{cardContent}</div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-1 flex-shrink-0 p-2 pt-3">
              {!notif.lu && (
                <button onClick={() => markRead(notif.id)} title="Marquer comme lu"
                  className="w-6 h-6 rounded flex items-center justify-center text-xs"
                  style={{ background: "var(--bg-3)", color: "var(--text-3)", cursor: "pointer", border: "none" }}>
                  ✓
                </button>
              )}
              <button onClick={() => deleteNotif(notif.id)} title="Supprimer"
                className="w-6 h-6 rounded flex items-center justify-center text-xs"
                style={{ background: "var(--bg-3)", color: "var(--text-3)", cursor: "pointer", border: "none" }}>
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Bouton "Gérer mon abonnement" (Pro uniquement) ────────

const API_URL_STRIPE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  const handlePortal = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("cineradar_token");
      const res = await fetch(`${API_URL_STRIPE}/api/stripe/portal`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePortal}
      disabled={loading}
      className="text-xs px-3 py-1.5 rounded-lg font-semibold"
      style={{ color: "var(--red)", border: "1px solid var(--red)", background: "transparent", cursor: "pointer" }}
    >
      {loading ? "…" : "✦ Gérer Pro"}
    </button>
  );
}

// ─────────────────────────────────────────────────────────
//  Onglet Messages (liste des conversations)
// ─────────────────────────────────────────────────────────

function MessagesTab({ onUnreadChange }: { onUnreadChange: (n: number) => void }) {
  const [conversations, setConversations] = useState<MessageConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    messagesApi.getConversations()
      .then(data => {
        setConversations(data);
        const totalUnread = data.reduce((s, c) => s + c.unreadCount, 0);
        onUnreadChange(totalUnread);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [onUnreadChange]);

  function fmtTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    }
    const yest = new Date(now); yest.setDate(yest.getDate() - 1);
    if (d.toDateString() === yest.toDateString()) return "Hier";
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  if (loading) return (
    <div className="flex flex-col gap-2 pt-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }}>
          <div className="w-12 h-12 rounded-full flex-shrink-0" style={{ background: "var(--bg-3)" }} />
          <div className="flex-1 space-y-2">
            <div className="h-3 rounded" style={{ background: "var(--bg-3)", width: "40%" }} />
            <div className="h-3 rounded" style={{ background: "var(--bg-3)", width: "65%" }} />
          </div>
        </div>
      ))}
    </div>
  );

  if (error) return (
    <div className="text-center py-12">
      <p className="text-sm" style={{ color: "var(--text-3)" }}>Impossible de charger les messages.</p>
    </div>
  );

  if (conversations.length === 0) return (
    <div className="flex flex-col items-center py-14 gap-3">
      <span style={{ fontSize: "2.5rem" }}>💬</span>
      <p className="font-semibold" style={{ color: "var(--text)" }}>Aucune conversation</p>
      <p className="text-sm" style={{ color: "var(--text-3)" }}>Visitez le profil d&apos;un utilisateur pour lui envoyer un message.</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-1">
      {conversations.map(conv => {
        const name = conv.partner.pseudo ?? conv.partner.nom ?? "?";
        const hasUnread = conv.unreadCount > 0;
        return (
          <Link
            key={conv.partner.id}
            href={`/messages/${encodeURIComponent(name)}`}
            className="flex items-center gap-3 px-3 py-3 rounded-xl no-underline transition-colors"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-base text-white overflow-hidden"
              style={{ background: "var(--red)" }}
            >
              {conv.partner.avatar
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={conv.partner.avatar} alt={name} className="w-full h-full object-cover" />
                : name.slice(0, 2).toUpperCase()
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text)", fontWeight: hasUnread ? 700 : 600 }}>
                  @{name}
                </p>
                <span className="text-xs flex-shrink-0" style={{ color: hasUnread ? "var(--red)" : "var(--text-3)", fontWeight: hasUnread ? 600 : 400 }}>
                  {fmtTime(conv.lastMessage.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className="text-xs truncate" style={{ color: hasUnread ? "var(--text-2)" : "var(--text-3)", fontWeight: hasUnread ? 500 : 400 }}>
                  {conv.lastMessage.fromMe && <span style={{ color: "var(--text-3)" }}>Vous : </span>}
                  {conv.lastMessage.content}
                </p>
                {hasUnread && (
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: "var(--red)", fontSize: "0.65rem" }}
                  >
                    {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function ProfilClient() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const t = searchParams?.get("tab");
    if (t === "notifications" || t === "messages" || t === "vitrine" || t === "stats" || t === "simple-stats" || t === "pour-vous" || t === "classiques") return t as Tab;
    return "vitrine";
  });

  // Sync l'onglet actif quand les searchParams changent (ex: clic sur l'icône 🔔 → ?tab=notifications)
  useEffect(() => {
    const t = searchParams?.get("tab");
    if (t === "notifications" || t === "messages" || t === "vitrine" || t === "stats" || t === "simple-stats" || t === "pour-vous") {
      setActiveTab(t as Tab);
    }
  }, [searchParams]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // ── Affiches personnalisées (Pro) ─────────────────────
  const [posterChoices, setPosterChoices] = useState<Record<string, string>>({});
  const [pickerFilm, setPickerFilm] = useState<{ id: string; titre: string; affiche: string | null } | null>(null);

  // Scroll des onglets (desktop)
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [tabsCanScrollLeft, setTabsCanScrollLeft] = useState(false);
  const [tabsCanScrollRight, setTabsCanScrollRight] = useState(true);
  const onTabsScroll = () => {
    const el = tabsScrollRef.current;
    if (!el) return;
    setTabsCanScrollLeft(el.scrollLeft > 4);
    setTabsCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };
  const scrollTabs = (dir: "left" | "right") => {
    tabsScrollRef.current?.scrollBy({ left: dir === "right" ? 220 : -220, behavior: "smooth" });
  };

  // Long-press mobile (partagé entre tous les onglets)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startLongPress = (film: { id: string; titre: string; affiche: string | null }) => {
    longPressTimer.current = setTimeout(() => setPickerFilm(film), 500);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  // Edition du profil
  const [editingNom, setEditingNom] = useState(false);
  const [nom, setNom] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState("");
  const [editingVille, setEditingVille] = useState(false);
  const [ville, setVille] = useState("");
  const [editingPseudo, setEditingPseudo] = useState(false);
  const [pseudoInput, setPseudoInput] = useState("");
  const [pseudoError, setPseudoError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [croppingFile, setCroppingFile] = useState<File | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);
  const [myFollowers, setMyFollowers] = useState<UserSearch[]>([]);
  const [myFollowing, setMyFollowing] = useState<UserSearch[]>([]);
  const [followListLoading, setFollowListLoading] = useState(false);
  const avatarLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startAvatarLongPress = (src: string) => {
    avatarLongPressTimer.current = setTimeout(() => setViewingImage(src), 600);
  };
  const cancelAvatarLongPress = () => {
    if (avatarLongPressTimer.current) { clearTimeout(avatarLongPressTimer.current); avatarLongPressTimer.current = null; }
  };

  // Persistance
  useEffect(() => {
    const savedEmail = localStorage.getItem("cineradar_email");
    const savedToken = localStorage.getItem("cineradar_token");
    if (savedEmail) setEmail(savedEmail);
    if (savedToken) setToken(savedToken);
    if (savedToken && savedEmail) {
      authApi.me().then((u) => setAuthUser(u)).catch(() => {
        // Token expiré — ne pas le supprimer ici, ça casse isPro/token
        // L'utilisateur sera simplement traité comme non-Pro
      });
    }
  }, []);

  const loadProfil = useCallback(async (mail: string) => {
    setLoading(true);
    try {
      const p = await profilApi.getProfil(mail);
      setProfil(p);
      setNom(p.nom ?? "");
      setBio(p.bio ?? "");
      setVille(p.ville ?? "");
      // Stocker l'avatar et le pseudo dans localStorage pour la Navbar
      if (p.avatar) {
        localStorage.setItem("cineradar_avatar", p.avatar);
      } else {
        localStorage.removeItem("cineradar_avatar");
      }
      if (p.pseudo) localStorage.setItem("cineradar_pseudo", p.pseudo);
    } catch { console.error("Erreur chargement profil"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (email) loadProfil(email);
  }, [email, loadProfil]);

  // Charger abonnés / abonnements dès que le pseudo est disponible
  useEffect(() => {
    const p = authUser?.pseudo ?? profil?.pseudo ?? null;
    if (!p) return;
    socialApi.getFollowers(p).then(setMyFollowers).catch(() => {});
    socialApi.getFollowing(p).then(setMyFollowing).catch(() => {});
  }, [authUser?.pseudo, profil?.pseudo]);

  // Charger les choix d'affiches personnalisées (Pro seulement)
  const isPro = authUser?.isPremium ?? profil?.isPremium ?? false;
  useEffect(() => {
    if (!isPro || !email) return;
    const PAPI = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";
    fetch(`${PAPI}/api/profil/${encodeURIComponent(email)}/poster-choices`)
      .then(r => r.ok ? r.json() : {})
      .then((data: Record<string, string>) => setPosterChoices(data))
      .catch(() => {});
  }, [isPro, email]);

  const posterFor = (filmId: string, defaultAffiche: string | null): string | null =>
    posterChoices[filmId] ?? defaultAffiche;

  const openFollowModal = async (type: "followers" | "following", p: string) => {
    setFollowModal(type);
    setFollowListLoading(true);
    try {
      const list = type === "followers"
        ? await socialApi.getFollowers(p)
        : await socialApi.getFollowing(p);
      if (type === "followers") setMyFollowers(list);
      else setMyFollowing(list);
    } catch { /* ignore */ }
    finally { setFollowListLoading(false); }
  };

  const handleAuth = (mail: string, tkn: string, user: AuthUser) => {
    localStorage.setItem("cineradar_email", mail);
    if (user.pseudo) localStorage.setItem("cineradar_pseudo", user.pseudo);
    if (tkn) {
      localStorage.setItem("cineradar_token", tkn);
      setToken(tkn); // ← indispensable pour PosterPicker + Notifications
      // Charger le profil complet (avec isPremium) depuis /auth/me
      authApi.me().then((fullUser) => {
        setAuthUser(fullUser);
        if (fullUser.pseudo) localStorage.setItem("cineradar_pseudo", fullUser.pseudo);
      }).catch(() => setAuthUser(user));
    } else {
      setAuthUser(user);
    }
    setEmail(mail);
  };

  const handleLogout = async () => {
    if (localStorage.getItem("cineradar_token")) {
      await authApi.logout().catch(() => {});
    }
    localStorage.removeItem("cineradar_email");
    localStorage.removeItem("cineradar_token");
    localStorage.removeItem("cineradar_avatar");
    localStorage.removeItem("cineradar_pseudo");
    setEmail(null);
    setAuthUser(null);
    setToken(null);
    setProfil(null);
  };

  const handleSaveNom = async () => {
    if (!email) return;
    await profilApi.updateProfil(email, { nom });
    await loadProfil(email);
    setEditingNom(false);
  };

  const handleSaveBio = async () => {
    if (!email) return;
    await profilApi.updateProfil(email, { bio });
    await loadProfil(email);
    setEditingBio(false);
  };

  const handleSaveVille = async () => {
    if (!email) return;
    await profilApi.updateProfil(email, { ville });
    await loadProfil(email);
    setEditingVille(false);
  };

  const handleSavePseudo = async () => {
    setPseudoError("");
    if (!email || !pseudoInput.trim()) return;
    try {
      if (authUser) {
        // Mode JWT : utilise l'endpoint auth
        const res = await authApi.updatePseudo(pseudoInput.trim());
        localStorage.setItem("cineradar_token", res.token);
        setAuthUser((prev) => prev ? { ...prev, pseudo: res.pseudo } : null);
      } else {
        // Mode legacy : utilise l'endpoint profil
        await profilApi.updateProfil(email, { pseudo: pseudoInput.trim() } as Parameters<typeof profilApi.updateProfil>[1]);
      }
      await loadProfil(email);
      setEditingPseudo(false);
    } catch (err: unknown) {
      setPseudoError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !email) return;
    if (!file.type.startsWith("image/")) return;
    e.target.value = "";
    // Sur mobile (écran tactile) : center-crop automatique sans modal
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    if (isMobile) {
      setUploadingAvatar(true);
      try {
        const dataUrl = await resizeImage(file, 240);
        await profilApi.updateProfil(email, { avatar: dataUrl });
        await loadProfil(email);
      } catch (err) { console.error("Erreur upload avatar", err); }
      finally { setUploadingAvatar(false); }
    } else {
      setCroppingFile(file);
    }
  };

  const handleAvatarCrop = async (dataUrl: string) => {
    if (!email) return;
    setUploadingAvatar(true);
    setCroppingFile(null);
    try {
      await profilApi.updateProfil(email, { avatar: dataUrl });
      await loadProfil(email);
    } catch (err) { console.error("Erreur upload avatar", err); }
    finally { setUploadingAvatar(false); }
  };

  const removeFavori = async (filmId: string) => { if (!email) return; await profilApi.removeFavori(email, filmId); await loadProfil(email); };
  const removeWatchlist = async (filmId: string) => { if (!email) return; await profilApi.removeWatchlist(email, filmId); await loadProfil(email); };
  const removeCinema = async (cinemaId: string) => { if (!email) return; await profilApi.removeCinema(email, cinemaId); await loadProfil(email); };
  const deleteAvis = async (filmId: string) => { if (!email) return; await profilApi.deleteAvis(email, filmId); await loadProfil(email); };
  const removeFilmVu = async (id: string) => { if (!email) return; await profilApi.removeFilmVu(email, id); await loadProfil(email); };

  if (!email) return <AuthForm onAuth={handleAuth} />;
  if (loading || !profil) {
    return <div className="flex items-center justify-center py-20"><p style={{ color: "var(--text-3)" }}>Chargement…</p></div>;
  }

  const pseudo = authUser?.pseudo ?? profil.pseudo ?? null;
  const emailVerified = (authUser as (AuthUser & { emailVerified?: boolean }) | null)?.emailVerified ?? true;
  const initiales = getInitiales(email, profil.nom);

  const TABS: { id: Tab; label: string; short: string; icon: string; count?: number }[] = [
    { id: "vitrine",       label: "Vitrine",       short: "Vitrine",  icon: "🎬" },
    ...(!isPro ? [{ id: "simple-stats" as Tab, label: "Stats",      short: "Stats",    icon: "📊" }] : []),
    { id: "stats",         label: "CinéScope",     short: "CinéScope", icon: "🔭" },
    { id: "pour-vous",    label: "Pour vous",     short: "Pour vous", icon: "✨" },
    { id: "listes",        label: "Mes listes",    short: "Listes",   icon: "📋" },
    { id: "vus",           label: "Films vus",     short: "Vus",      icon: "✓",  count: profil.stats.filmsVus },
    { id: "favoris",       label: "Favoris",       short: "Favoris",  icon: "❤️", count: profil.stats.favoris },
    { id: "watchlist",     label: "À voir",        short: "À voir",   icon: "🔖", count: profil.stats.watchlist },
    { id: "avis",          label: "Avis",          short: "Avis",     icon: "⭐", count: profil.stats.avis },
    { id: "cinemas",       label: "Cinémas",       short: "Cinémas",  icon: "🏛️", count: profil.stats.cinemas },
    { id: "communaute",    label: "Communauté",    short: "Communauté",   icon: "👥" },
    { id: "notifications", label: "Notifications", short: "Notifications", icon: "🔔", count: unreadNotifs > 0 ? unreadNotifs : undefined },
    { id: "messages",      label: "Messages",       short: "Messages",      icon: "💬", count: unreadMessages > 0 ? unreadMessages : undefined },
  ];

  return (
    <div className="px-6 py-10 mx-auto" style={{ maxWidth: 1100 }}>

      {/* ── Banner email non vérifié ────────────────────── */}
      {!emailVerified && (
        <EmailVerifBanner email={email} />
      )}

      {/* ── En-tête profil ─────────────────────────────── */}
      <div className="mb-8 rounded-2xl" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", overflow: "hidden" }}>

        {/* Ligne 1 : avatar + infos */}
        <div className="flex items-start gap-4 p-4 sm:p-6">
          {/* Avatar */}
          <label
            className="group relative flex-shrink-0 rounded-full overflow-hidden cursor-pointer shadow-md"
            title="Changer la photo"
            style={{
              background: "var(--red)",
              width: "clamp(64px, 10vw, 96px)",
              height: "clamp(64px, 10vw, 96px)",
              WebkitUserSelect: "none",
              userSelect: "none",
              WebkitTouchCallout: "none",
            } as React.CSSProperties}
            onContextMenu={(e) => { e.preventDefault(); if (profil.avatar) setViewingImage(profil.avatar); }}
            onMouseDown={() => { if (profil.avatar) startAvatarLongPress(profil.avatar); }}
            onMouseUp={cancelAvatarLongPress}
            onMouseLeave={cancelAvatarLongPress}
            onTouchStart={() => { if (profil.avatar) startAvatarLongPress(profil.avatar); }}
            onTouchEnd={cancelAvatarLongPress}
          >
            {profil.avatar
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={profil.avatar} alt="Avatar" className="w-full h-full object-cover" />
              : <span className="w-full h-full flex items-center justify-center text-xl font-extrabold text-white">{initiales}</span>
            }
            <span className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.55)" }}>
              {uploadingAvatar
                ? <span className="text-white text-xs">…</span>
                : <span className="text-white text-lg">📷</span>
              }
            </span>
            <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarFile} disabled={uploadingAvatar} />
          </label>

          {/* Infos */}
          <div className="flex-1 min-w-0">

            {/* Pseudo */}
            {editingPseudo ? (
              <div className="flex flex-col gap-1 mb-2">
                <div className="flex gap-2 items-center flex-wrap">
                  <input
                    value={pseudoInput}
                    onChange={(e) => setPseudoInput(e.target.value)}
                    placeholder="@pseudo (3–20 car.)"
                    className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none"
                    style={{ minWidth: 0, background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text)" }}
                  />
                  <button onClick={handleSavePseudo} className="px-3 py-1.5 rounded-lg text-sm text-white flex-shrink-0" style={{ background: "var(--red)", cursor: "pointer" }}>OK</button>
                  <button onClick={() => { setEditingPseudo(false); setPseudoError(""); }} className="px-3 py-1.5 rounded-lg text-sm flex-shrink-0" style={{ color: "var(--text-3)", cursor: "pointer" }}>✕</button>
                </div>
                {pseudoError && <p className="text-xs" style={{ color: "#dc2626" }}>{pseudoError}</p>}
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-base sm:text-lg font-extrabold truncate" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
                  {pseudo ? `@${pseudo}` : <span style={{ color: "var(--text-3)", fontStyle: "italic", fontSize: "0.85rem" }}>Pas de pseudo</span>}
                </h1>
                {isPro && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "var(--red)", color: "white" }}>✦ Pro</span>
                )}
                <button onClick={() => { setEditingPseudo(true); setPseudoInput(pseudo ?? ""); }} className="text-xs flex-shrink-0" style={{ color: "var(--text-3)", cursor: "pointer" }} title="Modifier">✏️</button>
              </div>
            )}

            {/* Bio */}
            {editingBio ? (
              <div className="flex flex-col gap-1 mb-2">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Une courte présentation…"
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-lg text-xs outline-none resize-none"
                  style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveBio} className="px-3 py-1 rounded-lg text-xs text-white" style={{ background: "var(--red)", cursor: "pointer" }}>OK</button>
                  <button onClick={() => setEditingBio(false)} className="px-3 py-1 rounded-lg text-xs" style={{ color: "var(--text-3)", cursor: "pointer" }}>Annuler</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-1 mb-1">
                <p className="text-xs italic truncate" style={{ color: "var(--text-2)" }}>
                  {profil.bio || <span style={{ color: "var(--text-3)" }}>Ajouter une bio…</span>}
                </p>
                <button onClick={() => setEditingBio(true)} className="text-xs flex-shrink-0" style={{ color: "var(--text-3)", cursor: "pointer" }}>✏️</button>
              </div>
            )}

            {/* Ville */}
            {editingVille ? (
              <div className="flex gap-2 items-center flex-wrap">
                <input
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  placeholder="Votre ville"
                  className="flex-1 px-3 py-1 rounded-lg text-xs outline-none"
                  style={{ minWidth: 0, background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
                <button onClick={handleSaveVille} className="px-3 py-1 rounded-lg text-xs text-white flex-shrink-0" style={{ background: "var(--red)", cursor: "pointer" }}>OK</button>
                <button onClick={() => setEditingVille(false)} className="px-3 py-1 rounded-lg text-xs flex-shrink-0" style={{ color: "var(--text-3)", cursor: "pointer" }}>✕</button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-xs" style={{ color: "var(--text-3)" }}>
                  {profil.ville ? `📍 ${profil.ville}` : <span style={{ opacity: 0.5 }}>📍 Ville…</span>}
                </span>
                <button onClick={() => setEditingVille(true)} className="text-xs" style={{ color: "var(--text-3)", cursor: "pointer" }}>✏️</button>
              </div>
            )}

            {/* Abonnés / Abonnements */}
            {pseudo && (
              <div className="flex items-center gap-3 mt-1.5">
                <button
                  onClick={() => openFollowModal("followers", pseudo)}
                  className="text-xs hover:underline"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--text-3)" }}
                >
                  <span className="font-bold" style={{ color: "var(--text-2)" }}>{myFollowers.length}</span> abonnés
                </button>
                <span style={{ color: "var(--text-3)" }}>·</span>
                <button
                  onClick={() => openFollowModal("following", pseudo)}
                  className="text-xs hover:underline"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--text-3)" }}
                >
                  <span className="font-bold" style={{ color: "var(--text-2)" }}>{myFollowing.length}</span> abonnements
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Ligne 2 : boutons CTA — toujours en bas, jamais superposés */}
        <div
          className="flex flex-wrap gap-2 px-4 sm:px-6 py-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {pseudo && (
            <Link
              href={`/profil/${pseudo}`}
              className="text-xs px-3 py-1.5 rounded-lg no-underline"
              style={{ color: "var(--text-2)", border: "1px solid var(--border)", background: "var(--bg-3)" }}
            >
              👤 Profil public
            </Link>
          )}
          <button
            onClick={() => setActiveTab("notifications")}
            className="relative text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
            style={{
              color: unreadNotifs > 0 ? "var(--red)" : "var(--text-2)",
              border: `1px solid ${unreadNotifs > 0 ? "var(--red)" : "var(--border)"}`,
              background: "var(--bg-3)",
              cursor: "pointer",
              fontWeight: unreadNotifs > 0 ? 700 : 400,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadNotifs > 0 ? `${unreadNotifs} notification${unreadNotifs > 1 ? "s" : ""}` : "Notifications"}
          </button>
          <Link
            href="/parametres"
            className="text-xs px-3 py-1.5 rounded-lg no-underline"
            style={{ color: "var(--text-2)", border: "1px solid var(--border)", background: "var(--bg-3)" }}
          >
            ⚙️ Paramètres
          </Link>
          {/* Bouton Pro selon le statut */}
          {isPro ? (
            <ManageSubscriptionButton />
          ) : (
            <Link
              href="/premium"
              className="text-xs px-3 py-1.5 rounded-lg no-underline font-bold"
              style={{ background: "var(--red)", color: "white", border: "1px solid var(--red)" }}
            >
              ✦ Passer Pro
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ color: "var(--text-3)", border: "1px solid var(--border)", background: "var(--bg-3)", cursor: "pointer" }}
          >
            Se déconnecter
          </button>
        </div>
      </div>

      {/* ── Onglets ─────────────────────────────────────── */}
      <div className="relative mb-6">
        {/* Flèche gauche — desktop uniquement */}
        {tabsCanScrollLeft && (
          <button
            onClick={() => scrollTabs("left")}
            className="hidden sm:flex absolute left-0 top-0 h-full items-center justify-center z-10 w-8"
            style={{ background: "linear-gradient(to right, var(--bg) 60%, transparent)", border: "none", cursor: "pointer", color: "var(--text-2)" }}
          >
            ‹
          </button>
        )}
        <div
          ref={tabsScrollRef}
          className="overflow-x-auto no-scrollbar"
          style={{ WebkitOverflowScrolling: "touch", paddingLeft: tabsCanScrollLeft ? 28 : 0, paddingRight: tabsCanScrollRight ? 28 : 0 } as React.CSSProperties}
          onScroll={onTabsScroll}
        >
        <div className="flex gap-1.5 pb-1" style={{ minWidth: "max-content" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-full transition-all"
              style={{
                background: activeTab === tab.id ? "var(--red)" : "var(--bg-2)",
                color: activeTab === tab.id ? "white" : "var(--text-2)",
                border: `1.5px solid ${activeTab === tab.id ? "var(--red)" : "var(--border)"}`,
                cursor: "pointer",
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: "0.75rem",
                padding: "6px 12px",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: "0.85rem", lineHeight: 1 }}>{tab.icon}</span>
              <span>{tab.short}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className="rounded-full"
                  style={{
                    background: activeTab === tab.id ? "rgba(255,255,255,0.3)" : "var(--bg-3)",
                    color: activeTab === tab.id ? "white" : "var(--text-3)",
                    fontSize: "0.6rem",
                    padding: "1px 5px",
                    fontWeight: 700,
                    lineHeight: 1.5,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        </div>
        {/* Flèche droite — desktop uniquement */}
        {tabsCanScrollRight && (
          <button
            onClick={() => scrollTabs("right")}
            className="hidden sm:flex absolute right-0 top-0 h-full items-center justify-center z-10 w-8"
            style={{ background: "linear-gradient(to left, var(--bg) 60%, transparent)", border: "none", cursor: "pointer", color: "var(--text-2)" }}
          >
            ›
          </button>
        )}
      </div>

      {/* ── Contenu des onglets ─────────────────────────── */}

      {activeTab === "vitrine" && email && (
        <VitrineTab
          profil={profil}
          email={email}
          isPro={isPro}
          onRefresh={() => loadProfil(email)}
          posterChoices={posterChoices}
          onPickerOpen={setPickerFilm}
          startLongPress={startLongPress}
          cancelLongPress={cancelLongPress}
        />
      )}

      {activeTab === "simple-stats" && (
        <SimpleStatsSection profil={profil} />
      )}

      {activeTab === "stats" && (
        isPro ? (
          <CineScopeSection profil={profil} email={email} />
        ) : (
          <div className="text-center py-16 px-4">
            <p className="text-4xl mb-3">🔭</p>
            <p className="text-lg font-extrabold mb-2" style={{ color: "var(--text)" }}>CinéScope — réservé aux membres Pro</p>
            <p className="text-sm mb-6" style={{ color: "var(--text-3)", maxWidth: 360, margin: "0 auto 1.5rem" }}>
              Accédez à votre tableau de bord complet : genres préférés, réalisateurs, évolution mensuelle et bien plus.
            </p>
            <Link
              href="/premium"
              className="inline-block px-6 py-3 rounded-xl text-sm font-bold text-white no-underline"
              style={{ background: "var(--red)" }}
            >
              Passer à Pro →
            </Link>
          </div>
        )
      )}

      {activeTab === "pour-vous" && (
        isPro ? (
          <RecommandationsSection email={email} />
        ) : (
          <div className="text-center py-16 px-4">
            <p className="text-4xl mb-3">✨</p>
            <p className="text-lg font-extrabold mb-2" style={{ color: "var(--text)" }}>Recommandations — réservé aux membres Pro</p>
            <p className="text-sm mb-6" style={{ color: "var(--text-3)", maxWidth: 360, margin: "0 auto 1.5rem" }}>
              Découvrez des films sélectionnés pour vous selon vos goûts : genres, réalisateurs et notes IMDB.
            </p>
            <Link href="/premium" className="inline-block px-6 py-3 rounded-xl text-sm font-bold text-white no-underline" style={{ background: "var(--red)" }}>
              Passer à Pro →
            </Link>
          </div>
        )
      )}

      {activeTab === "listes" && (
        <MesListesSection token={token} onReconnect={handleLogout} />
      )}

      {activeTab === "vus" && (
        profil.filmsVus.length === 0
          ? <EmptyState icon="🎬" titre="Aucun film vu encore" texte='Marquez des films comme vus depuis leurs pages.' />
          : <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>
              {profil.filmsVus.map((fv) => (
                <FilmVuCard
                  key={fv.id}
                  fv={fv}
                  onRemove={() => removeFilmVu(fv.id)}
                  posterSrc={posterFor(fv.film.id, fv.film.affiche)}
                  onPickerOpen={isPro ? setPickerFilm : undefined}
                />
              ))}
            </div>
      )}

      {activeTab === "favoris" && (
        profil.filmsFavoris.length === 0
          ? <EmptyState icon="❤️" titre="Aucun film favori" texte="Ajoutez des films depuis la vitrine ou les pages films." />
          : <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
              {profil.filmsFavoris.map((film) => (
                <FilmCard
                  key={film.id}
                  film={film}
                  onRemove={() => removeFavori(film.id)}
                  posterSrc={posterFor(film.id, film.affiche)}
                  onPickerOpen={isPro ? setPickerFilm : undefined}
                />
              ))}
            </div>
      )}

      {activeTab === "watchlist" && (
        profil.watchlist.length === 0
          ? <EmptyState icon="🔖" titre="Votre liste est vide" texte="Ajoutez des films à voir plus tard depuis leurs pages." />
          : <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
              {profil.watchlist.map((film) => (
                <FilmCard
                  key={film.id}
                  film={film}
                  onRemove={() => removeWatchlist(film.id)}
                  posterSrc={posterFor(film.id, film.affiche)}
                  onPickerOpen={isPro ? setPickerFilm : undefined}
                />
              ))}
            </div>
      )}

      {activeTab === "avis" && (
        profil.avis.length === 0
          ? <EmptyState icon="⭐" titre="Aucun avis encore" texte="Notez et critiquez les films depuis leurs pages." />
          : <div className="flex flex-col gap-3">
              {profil.avis.map((a) => (
                <AvisCard
                  key={a.filmId}
                  avis={a}
                  onDelete={() => deleteAvis(a.filmId)}
                  posterSrc={posterFor(a.filmId, a.film?.affiche ?? null)}
                  onPickerOpen={isPro ? setPickerFilm : undefined}
                />
              ))}
            </div>
      )}

      {activeTab === "cinemas" && (
        profil.cinemasFavoris.length === 0
          ? <EmptyState icon="🏛️" titre="Aucun cinéma favori" texte="Ajoutez vos cinémas préférés depuis leurs pages." />
          : <div className="flex flex-col gap-3">
              {profil.cinemasFavoris.map((cinema) => (
                <div key={cinema.id} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: "var(--bg-3)" }}>🏛️</div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/cinemas/${cinema.id}`} className="no-underline font-semibold text-sm" style={{ color: "var(--text)" }}>{cinema.nom}</Link>
                    {cinema.chaine && <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--bg-3)", color: "var(--text-3)" }}>{cinema.chaine}</span>}
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{cinema.adresse} · {cinema.ville}</p>
                  </div>
                  <button onClick={() => removeCinema(cinema.id)} className="text-sm px-2 py-1 rounded" style={{ color: "var(--text-3)", cursor: "pointer" }}>✕</button>
                </div>
              ))}
            </div>
      )}

      {activeTab === "communaute" && <CommunauteTab pseudo={pseudo} />}

      {activeTab === "notifications" && (
        <NotificationsTab
          token={token}
          onUnreadChange={setUnreadNotifs}
        />
      )}

      {activeTab === "messages" && (
        <MessagesTab onUnreadChange={setUnreadMessages} />
      )}

      {/* ── PosterPicker modal global (Pro) ─────────────── */}
      {pickerFilm && (
        <PosterPicker
          filmId={pickerFilm.id}
          filmTitre={pickerFilm.titre}
          email={email}
          token={token ?? (typeof window !== "undefined" ? localStorage.getItem("cineradar_token") : null) ?? ""}
          currentPoster={posterChoices[pickerFilm.id] ?? pickerFilm.affiche}
          onClose={() => setPickerFilm(null)}
          onSelect={(url) => {
            setPosterChoices((prev) => ({ ...prev, [pickerFilm.id]: url }));
            setPickerFilm(null);
          }}
        />
      )}

      {/* ── Image Cropper modal ──────────────────────────── */}
      {croppingFile && (
        <ImageCropper
          file={croppingFile}
          onCrop={handleAvatarCrop}
          onCancel={() => setCroppingFile(null)}
        />
      )}

      {/* ── Image Viewer (long-press) ────────────────────── */}
      {viewingImage && (
        <ImageViewer
          src={viewingImage}
          onClose={() => setViewingImage(null)}
        />
      )}

      {/* ── Modal abonnés / abonnements ─────────────────── */}
      {followModal && pseudo && (
        <FollowListModal
          title={followModal === "followers"
            ? `Abonnés · ${myFollowers.length}`
            : `Abonnements · ${myFollowing.length}`}
          users={followModal === "followers" ? myFollowers : myFollowing}
          loading={followListLoading}
          onClose={() => setFollowModal(null)}
        />
      )}
    </div>
  );
}
