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
 * Composant serveur async : récupère le trailer depuis l'API
 * puis intègre l'iframe YouTube. Si aucun trailer trouvé, rien n'est affiché.
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
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.5)" }}
                >
                  <span className="text-white text-lg font-semibold flex items-center gap-2">
                    🎬 Voir sur YouTube ↗
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
    `?rel=0&modestbranding=1&cc_load_policy=0&hl=fr&enablejsapi=1`;

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
