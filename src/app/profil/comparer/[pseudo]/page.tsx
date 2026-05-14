"use client";

// ─────────────────────────────────────────────────────────
//  Page de comparaison de profils cinéphiles
//  /profil/comparer/[pseudo]
//
//  Affiche côte à côte :
//   - Films en commun (nombre + 6 premiers)
//   - Films que l'un a vu et pas l'autre
//   - Score de compatibilité cinéphile (%)
// ─────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  authApi,
  profilApi,
  socialApi,
  type PublicProfil,
  type Profil,
  type FilmResume,
} from "@/lib/api";
import FilmPoster from "@/components/FilmPoster";

// ── Helpers ──────────────────────────────────────────────

function extraireFilmsVus(profil: Profil | PublicProfil): FilmResume[] {
  return profil.filmsVus.map((fv) => fv.film);
}

function dedupeById(films: FilmResume[]): FilmResume[] {
  const seen = new Set<string>();
  return films.filter((f) => {
    if (seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });
}

// ── Jauge de compatibilité ────────────────────────────────

function JaugeCompatibilite({ score }: { score: number }) {
  const pct = Math.round(score);
  const color =
    pct >= 70 ? "var(--red)" :
    pct >= 40 ? "#f59e0b" :
    "var(--text-3)";
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: 120,
          height: 120,
          background: `conic-gradient(${color} ${pct}%, var(--bg-3) ${pct}%)`,
        }}
      >
        <div
          className="absolute flex flex-col items-center justify-center rounded-full"
          style={{
            width: 90,
            height: 90,
            background: "var(--bg-2)",
          }}
        >
          <span className="text-2xl font-extrabold" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-center" style={{ color: "var(--text-3)" }}>
        {pct >= 70
          ? "Excellente compatibilité !"
          : pct >= 40
          ? "Bonne compatibilité"
          : pct >= 20
          ? "Compatibilité modérée"
          : "Peu de films en commun"}
      </p>
    </div>
  );
}

// ── Grille de films ───────────────────────────────────────

function FilmGrid({ films, label }: { films: FilmResume[]; label: string }) {
  if (films.length === 0) {
    return (
      <div
        className="p-4 rounded-xl text-center text-sm"
        style={{ background: "var(--bg-3)", color: "var(--text-3)", border: "1px dashed var(--border)" }}
      >
        {label}
      </div>
    );
  }
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))" }}>
      {films.map((film) => (
        <Link
          key={film.id}
          href={`/films/${film.id}`}
          className="no-underline rounded-xl overflow-hidden block"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <div className="relative w-full" style={{ aspectRatio: "2/3", background: "var(--bg-3)" }}>
            <FilmPoster src={film.affiche} alt={film.titre} fill sizes="100px" />
          </div>
          <div className="px-1.5 py-1">
            <p
              className="text-xs font-semibold truncate leading-snug"
              style={{ color: "var(--text)", textTransform: "uppercase" }}
            >
              {film.titre}
            </p>
            {film.annee && (
              <p className="text-xs" style={{ color: "var(--text-3)" }}>{film.annee}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── Section "Seul X a vu" ─────────────────────────────────

function SectionExclusif({
  films,
  pseudo,
  side,
}: {
  films: FilmResume[];
  pseudo: string;
  side: "moi" | "ami";
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? films : films.slice(0, 6);
  const label = side === "moi" ? "Vu par moi seulement" : `Vu par @${pseudo} seulement`;
  const accentColor = side === "moi" ? "var(--red)" : "var(--text-2)";

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold" style={{ color: accentColor }}>
          {label} ({films.length})
        </h3>
        {films.length > 6 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-xs px-2 py-1 rounded"
            style={{ background: "var(--bg-3)", color: "var(--text-3)", border: "none", cursor: "pointer" }}
          >
            {expanded ? "Réduire" : `Voir tout (${films.length})`}
          </button>
        )}
      </div>
      <FilmGrid
        films={shown}
        label="Aucun film exclusif"
      />
    </div>
  );
}

// ── Composant principal ───────────────────────────────────

export default function ComparaisonPage() {
  const rawParams = useParams();
  const pseudo = Array.isArray(rawParams.pseudo) ? rawParams.pseudo[0] : (rawParams.pseudo ?? "");

  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [moi, setMoi]               = useState<Profil | null>(null);
  const [ami, setAmi]               = useState<PublicProfil | null>(null);
  const [nonConnecte, setNonConnecte] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      // Vérification connexion
      const token = typeof window !== "undefined"
        ? localStorage.getItem("cineradar_token")
        : null;

      if (!token) {
        setNonConnecte(true);
        setLoading(false);
        return;
      }

      try {
        // Récupération en parallèle : mon profil + profil de l'ami
        const [authUser, amiProfil] = await Promise.all([
          authApi.me(),
          socialApi.getPublicProfil(pseudo),
        ] as const);

        const monProfil = await profilApi.getProfil(authUser.email);

        // Vérification qu'on ne se compare pas à soi-même
        if (authUser.pseudo && authUser.pseudo === pseudo) {
          setError("Vous ne pouvez pas vous comparer à vous-même !");
          setLoading(false);
          return;
        }

        setMoi(monProfil);
        setAmi(amiProfil);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        if (msg.includes("401") || msg.includes("Authentification")) {
          setNonConnecte(true);
        } else {
          setError(`Impossible de charger le profil : ${msg}`);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [pseudo]);

  // ── États de chargement / erreur ──────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p style={{ color: "var(--text-3)" }}>Chargement de la comparaison…</p>
      </div>
    );
  }

  if (nonConnecte) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-4">
        <p className="text-5xl">🔒</p>
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>
          Connexion requise
        </h1>
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          Connectez-vous pour comparer vos goûts cinéphiles avec @{pseudo}.
        </p>
        <Link
          href="/auth/login"
          className="px-5 py-2.5 rounded-xl font-semibold text-sm no-underline"
          style={{ background: "var(--red)", color: "white" }}
        >
          Se connecter
        </Link>
      </div>
    );
  }

  if (error || !moi || !ami) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-4">
        <p className="text-5xl">⚠️</p>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          {error ?? "Profil introuvable"}
        </h1>
        <Link
          href={`/profil/${pseudo}`}
          className="px-4 py-2 rounded-xl text-sm font-semibold no-underline"
          style={{ background: "var(--bg-3)", color: "var(--text-2)", border: "1px solid var(--border)" }}
        >
          Retour au profil de @{pseudo}
        </Link>
      </div>
    );
  }

  // ── Calcul de la comparaison ──────────────────────────

  const filmsVusMoi = dedupeById(extraireFilmsVus(moi));
  const filmsVusAmi = dedupeById(extraireFilmsVus(ami));

  const idsMoi = new Set(filmsVusMoi.map((f) => f.id));
  const idsAmi = new Set(filmsVusAmi.map((f) => f.id));

  const enCommun: FilmResume[] = filmsVusMoi.filter((f) => idsAmi.has(f.id));

  const seulementMoi  = filmsVusMoi.filter((f) => !idsAmi.has(f.id));
  const seulementAmi  = filmsVusAmi.filter((f) => !idsMoi.has(f.id));

  const totalUnion    = idsMoi.size + idsAmi.size - enCommun.length;
  const score         = totalUnion > 0 ? (enCommun.length / totalUnion) * 100 : 0;

  const enCommunAffiches = enCommun.slice(0, 6);

  // ── Rendu ─────────────────────────────────────────────

  const initialesMoi = (moi.nom ?? moi.pseudo ?? "?").slice(0, 2).toUpperCase();
  const initialesAmi = (ami.nom ?? ami.pseudo ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="px-4 py-10 mx-auto" style={{ maxWidth: 960 }}>

      {/* Breadcrumb */}
      <div className="mb-6 text-xs" style={{ color: "var(--text-3)" }}>
        <Link href="/" className="no-underline" style={{ color: "var(--text-3)" }}>Accueil</Link>
        {" / "}
        <Link href="/profil" className="no-underline" style={{ color: "var(--text-3)" }}>Profil</Link>
        {" / "}
        <Link href={`/profil/${pseudo}`} className="no-underline" style={{ color: "var(--text-3)" }}>@{pseudo}</Link>
        {" / "}
        <span>Comparaison</span>
      </div>

      <h1 className="text-2xl font-extrabold mb-8" style={{ color: "var(--text)" }}>
        Comparaison cinéphile
      </h1>

      {/* Avatars face à face */}
      <div
        className="flex items-center justify-between gap-4 p-6 rounded-2xl mb-8"
        style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
      >
        {/* Moi */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-extrabold text-white overflow-hidden"
            style={{ background: "var(--red)" }}
          >
            {moi.avatar
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={moi.avatar} alt={moi.pseudo ?? ""} className="w-full h-full object-cover" />
              : initialesMoi
            }
          </div>
          <p className="text-sm font-bold text-center" style={{ color: "var(--text)" }}>
            {moi.nom || moi.pseudo || "Moi"}
          </p>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            {filmsVusMoi.length} films vus
          </p>
        </div>

        {/* Score central */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <span className="text-3xl font-black" style={{ color: "var(--red)" }}>VS</span>
        </div>

        {/* Ami */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-extrabold text-white overflow-hidden"
            style={{ background: "var(--text-3)" }}
          >
            {ami.avatar
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={ami.avatar} alt={ami.pseudo ?? ""} className="w-full h-full object-cover" />
              : initialesAmi
            }
          </div>
          <p className="text-sm font-bold text-center" style={{ color: "var(--text)" }}>
            {ami.nom || ami.pseudo}
          </p>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            {filmsVusAmi.length} films vus
          </p>
        </div>
      </div>

      {/* Score de compatibilité */}
      <div
        className="flex flex-col items-center p-6 rounded-2xl mb-8"
        style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-sm font-bold mb-4" style={{ color: "var(--text)" }}>
          Score de compatibilité cinéphile
        </h2>
        <JaugeCompatibilite score={score} />
        <p className="text-xs mt-3 text-center" style={{ color: "var(--text-3)" }}>
          {enCommun.length} film{enCommun.length !== 1 ? "s" : ""} en commun
          {" sur "}
          {totalUnion} film{totalUnion !== 1 ? "s" : ""} vus au total
        </p>
      </div>

      {/* Films en commun */}
      <section
        className="p-5 rounded-2xl mb-6"
        style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
            🎬 Films vus en commun
            <span
              className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "var(--red-dim, rgba(220,38,38,0.1))", color: "var(--red)" }}
            >
              {enCommun.length}
            </span>
          </h2>
          {enCommun.length > 6 && (
            <span className="text-xs" style={{ color: "var(--text-3)" }}>
              6 premiers affichés
            </span>
          )}
        </div>
        <FilmGrid
          films={enCommunAffiches}
          label="Aucun film en commun — explorez ensemble !"
        />
      </section>

      {/* Films exclusifs de chacun */}
      <div className="grid gap-6 md:grid-cols-2">
        <section
          className="p-5 rounded-2xl"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <SectionExclusif
            films={seulementMoi}
            pseudo={moi.pseudo ?? "moi"}
            side="moi"
          />
        </section>

        <section
          className="p-5 rounded-2xl"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <SectionExclusif
            films={seulementAmi}
            pseudo={pseudo}
            side="ami"
          />
        </section>
      </div>

      {/* Retour */}
      <div className="mt-8 text-center">
        <Link
          href={`/profil/${pseudo}`}
          className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold no-underline"
          style={{ background: "var(--bg-3)", color: "var(--text-2)", border: "1px solid var(--border)" }}
        >
          ← Retour au profil de @{pseudo}
        </Link>
      </div>
    </div>
  );
}
