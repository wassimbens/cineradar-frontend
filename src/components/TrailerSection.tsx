// ─────────────────────────────────────────────────────────
//  TrailerSection — bande annonce YouTube intégrée
//  Utilise youtube-nocookie.com (GDPR-friendly, moins de pubs)
//  Paramètres : rel=0 (pas de suggestions), modestbranding=1
// ─────────────────────────────────────────────────────────

import { api } from "@/lib/api";

interface Props {
  filmId: string;
  filmTitre: string;
}

/**
 * Composant serveur async : récupère le trailer depuis l'API
 * puis intègre l'iframe YouTube. Si aucun trailer trouvé, rien n'est affiché.
 */
export default async function TrailerSection({ filmId, filmTitre }: Props) {
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
        <div
          className="rounded-xl p-6 flex flex-col items-center gap-4 text-center"
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
          }}
        >
          <p style={{ color: "var(--text)" }}>
            🎬 Aucune bande annonce disponible pour ce film
          </p>
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "var(--red)" }}
          >
            Rechercher sur YouTube ↗
          </a>
        </div>
      </section>
    );
  }

  const embedUrl =
    `https://www.youtube-nocookie.com/embed/${youtubeId}` +
    `?rel=0&modestbranding=1&cc_load_policy=0&hl=fr`;

  return (
    <section className="mt-8">
      <h2
        className="text-lg font-extrabold mb-4"
        style={{ color: "var(--text)" }}
      >
        Bande annonce
      </h2>
      <div
        className="relative w-full rounded-xl overflow-hidden shadow-lg"
        style={{ paddingBottom: "56.25%", background: "#000" }} // ratio 16:9
      >
        <iframe
          src={embedUrl}
          title={`Bande annonce — ${filmTitre}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: 0,
          }}
        />
      </div>
    </section>
  );
}
