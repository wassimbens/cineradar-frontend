// ─────────────────────────────────────────────────────────
//  TrailerSection — bande annonce YouTube intégrée
//  Utilise youtube-nocookie.com (GDPR-friendly, moins de pubs)
//  Paramètres : rel=0 (pas de suggestions), modestbranding=1
// ─────────────────────────────────────────────────────────

import Image from "next/image";
import { api } from "@/lib/api";
import TrailerPlayer from "./TrailerPlayer";

interface Props {
  filmId: string;
  filmTitre: string;
  filmAffiche: string | null;
}

/**
 * Vérifie via l'API oEmbed de YouTube si l'embedding est autorisé.
 * Retourne false si la vidéo retourne 401 (embedding désactivé) ou 404 (supprimée).
 */
async function isEmbeddable(youtubeId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`,
      { next: { revalidate: 3600 } }
    );
    return res.ok;
  } catch {
    return true; // en cas d'erreur réseau, on tente quand même l'iframe
  }
}

/**
 * Composant serveur async : récupère le trailer depuis l'API
 * puis vérifie si l'embedding est autorisé avant de rendre l'iframe.
 */
export default async function TrailerSection({ filmId, filmTitre, filmAffiche }: Props) {
  let youtubeId: string | null = null;
  try {
    const data = await api.getFilmTrailer(filmId);
    youtubeId = data.youtubeId;
  } catch {
    // Backend down ou pas de clé TMDB → fallback recherche YouTube
    youtubeId = null;
  }

  // Si on a un ID, vérifier que l'embedding est bien autorisé
  if (youtubeId && !(await isEmbeddable(youtubeId))) {
    youtubeId = null; // traiter comme "pas de bande annonce" → fallback affiche
  }

  if (!youtubeId) {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      filmTitre + " bande annonce officielle"
    )}`;

    return (
      <section className="mt-8">
        <h2
          className="text-lg font-extrabold mb-4"
          style={{ color: "var(--text)" }}
        >
          Bande annonce
        </h2>
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl overflow-hidden group"
          style={{ textDecoration: "none" }}
        >
          <div
            className="relative w-full rounded-xl overflow-hidden shadow-lg"
            style={{ paddingBottom: "56.25%", background: "#000" }}
          >
            {filmAffiche ? (
              <>
                <Image
                  src={filmAffiche}
                  alt={filmTitre}
                  fill
                  sizes="(max-width: 640px) 90vw, 850px"
                  style={{ objectFit: "contain", filter: "blur(3px)", transform: "scale(0.85)" }}
                  unoptimized
                />
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                  style={{ background: "rgba(0,0,0,0.5)" }}
                >
                  <span className="text-white text-4xl">▶</span>
                  <span className="text-white text-base font-semibold">
                    Voir la bande annonce sur YouTube ↗
                  </span>
                </div>
              </>
            ) : (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ background: "var(--bg-2)" }}
              >
                <p style={{ color: "var(--text)", marginBottom: "1rem" }}>
                  🎬 Aucune bande annonce disponible
                </p>
                <span className="text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Voir sur YouTube ↗
                </span>
              </div>
            )}
          </div>
        </a>
      </section>
    );
  }

  const embedUrl =
    `https://www.youtube-nocookie.com/embed/${youtubeId}` +
    `?rel=0&modestbranding=1&cc_load_policy=0&hl=fr`;

  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    filmTitre + " bande annonce officielle"
  )}`;

  return (
    <section className="mt-8">
      <h2
        className="text-lg font-extrabold mb-4"
        style={{ color: "var(--text)" }}
      >
        Bande annonce
      </h2>
      <TrailerPlayer
        youtubeId={youtubeId}
        filmTitre={filmTitre}
        filmAffiche={filmAffiche}
        embedUrl={embedUrl}
        searchUrl={searchUrl}
      />
    </section>
  );
}
