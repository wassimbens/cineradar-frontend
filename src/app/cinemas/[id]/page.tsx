import { notFound } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { SeanceGroupByFilm } from "@/components/SeanceGroup";
import ProgrammeNav from "./ProgrammeNav";
import CinemaFavoriButton from "@/components/CinemaFavoriButton";

// Régénération ISR : une fois par jour pour limiter les ISR Writes Vercel
export const revalidate = 86400;

// Import dynamique pour éviter l'erreur SSR de Leaflet (window n'existe pas côté serveur)
const MapCinema = dynamic(() => import("@/components/MapCinema"), { ssr: false });

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const cinema = await api.getCinema(id);
    const desc = `Programme, horaires et séances de ${cinema.nom} à ${cinema.ville}${cinema.codePostal ? ` (${cinema.codePostal})` : ""}. Retrouvez tous les films à l'affiche.`;
    return {
      title: `${cinema.nom} — CinéRadar`,
      description: desc,
      openGraph: {
        title: `${cinema.nom} — Programme & Séances`,
        description: desc,
        type: "website",
      },
    };
  } catch {
    return { title: "Cinéma — CinéRadar" };
  }
}

// ── Lien de réservation par chaîne ────────────────────────

function getBookingUrl(cinema: {
  chaine: string | null;
  siteWeb: string | null;
  nom: string;
}): string | null {
  if (!cinema.chaine) return cinema.siteWeb ?? null;

  const chain = cinema.chaine.toLowerCase();

  if (chain.includes("ugc")) {
    // UGC : le siteWeb est déjà la bonne URL si scraped correctement
    if (cinema.siteWeb?.includes("ugc.fr")) return cinema.siteWeb;
    // Fallback : recherche sur ugc.fr
    const slug = cinema.nom
      .toLowerCase()
      .replace(/ugc\s+/i, "")
      .replace(/[éèê]/g, "e").replace(/[àâ]/g, "a")
      .replace(/[ùû]/g, "u").replace(/[ôö]/g, "o")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return `https://www.ugc.fr/cinema-ugc-${slug}.html`;
  }

  if (chain.includes("pathé") || chain.includes("pathe")) {
    if (cinema.siteWeb?.includes("pathe.fr")) return cinema.siteWeb;
    const slug = cinema.nom
      .toLowerCase()
      .replace(/pathé\s+|pathe\s+/i, "pathe-")
      .replace(/[éèê]/g, "e").replace(/[àâ]/g, "a")
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-|-$/g, "");
    return `https://www.pathe.fr/cinemas/${slug}`;
  }

  if (chain.includes("mk2")) {
    if (cinema.siteWeb?.includes("mk2.com")) return cinema.siteWeb;
    const slug = cinema.nom
      .toLowerCase()
      .replace(/[éèê]/g, "e").replace(/[àâ]/g, "a")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return `https://www.mk2.com/nos-salles/${slug}`;
  }

  if (chain.includes("gaumont")) {
    return `https://www.ugc.fr`; // Gaumont est fusionné UGC
  }

  return cinema.siteWeb ?? null;
}

// ── Emoji par chaîne ──────────────────────────────────────

function getCinemaEmoji(chaine: string | null): string {
  if (!chaine) return "🎭";
  const c = chaine.toLowerCase();
  if (c.includes("ugc")) return "🎬";
  if (c.includes("pathé") || c.includes("pathe")) return "🎥";
  if (c.includes("mk2")) return "🎞️";
  if (c.includes("gaumont")) return "🎦";
  return "🎭";
}

// ── Couleur badge par chaîne ──────────────────────────────

function getChaineStyle(chaine: string | null): { bg: string; color: string } {
  if (!chaine) return { bg: "var(--bg-3)", color: "var(--text-2)" };
  const c = chaine.toLowerCase();
  if (c.includes("ugc"))    return { bg: "#1a1a2e", color: "#e8b4f8" };
  if (c.includes("pathé") || c.includes("pathe")) return { bg: "#1a2a1a", color: "#86efac" };
  if (c.includes("mk2"))    return { bg: "#2a1a1a", color: "#fca5a5" };
  return { bg: "var(--bg-3)", color: "var(--text-2)" };
}

// ── Page ──────────────────────────────────────────────────

export default async function CinemaPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { date } = await searchParams;

  let cinema;
  try {
    cinema = await api.getCinema(id);
  } catch {
    notFound();
  }

  const programme = await api.getCinemaProgramme(id, date).catch(() => []);
  const totalSeances = programme.reduce((acc, l) => acc + l.seances.length, 0);

  const bookingUrl = getBookingUrl(cinema);
  const emoji = getCinemaEmoji(cinema.chaine);
  const chaineStyle = getChaineStyle(cinema.chaine);

  // Date affichée
  const dateAffichee = date
    ? new Date(date + "T00:00:00").toLocaleDateString("fr-FR", {
        weekday: "long", day: "numeric", month: "long",
      })
    : "aujourd'hui";

  // JSON-LD pour le SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MovieTheater",
    name: cinema.nom,
    address: {
      "@type": "PostalAddress",
      streetAddress: cinema.adresse ?? undefined,
      addressLocality: cinema.ville,
      postalCode: cinema.codePostal ?? undefined,
      addressCountry: "FR",
    },
    ...(cinema.latitude && cinema.longitude ? {
      geo: {
        "@type": "GeoCoordinates",
        latitude: cinema.latitude,
        longitude: cinema.longitude,
      },
    } : {}),
    url: bookingUrl ?? undefined,
  };

  // FAQ schema pour l'AI Search
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Quels films sont à l'affiche au ${cinema.nom} ?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Retrouvez le programme complet du ${cinema.nom} à ${cinema.ville} sur CinéRadar : tous les films à l'affiche, horaires et versions disponibles sur https://cineradar.fr/cinemas/${id}`,
        },
      },
      {
        "@type": "Question",
        name: `Où se trouve le ${cinema.nom} ?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${cinema.nom} est situé ${cinema.adresse ? `au ${cinema.adresse}, ` : ""}à ${cinema.ville}${cinema.codePostal ? ` (${cinema.codePostal})` : ""}.`,
        },
      },
      {
        "@type": "Question",
        name: `Le ${cinema.nom} propose-t-il des séances en VOST ?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Consultez les séances en version originale sous-titrée (VOST) disponibles au ${cinema.nom} sur CinéRadar. Les disponibilités varient selon les films programmés.`,
        },
      },
      {
        "@type": "Question",
        name: `Comment réserver une place au ${cinema.nom} ?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${bookingUrl ? `Réservez vos places au ${cinema.nom} directement sur ${bookingUrl}. ` : ""}Consultez les horaires et disponibilités sur CinéRadar : https://cineradar.fr/cinemas/${id}`,
        },
      },
    ],
  };

  return (
    <div className="px-6 py-10 mx-auto" style={{ maxWidth: 900 }}>
      {/* JSON-LD MovieTheater */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* JSON-LD FAQ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      {/* Retour */}
      <Link
        href="/recherche?type=cinemas"
        className="inline-flex items-center gap-1 text-sm mb-6 no-underline"
        style={{ color: "var(--text-3)" }}
      >
        ← Cinémas
      </Link>

      {/* ── En-tête cinéma ─────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-start gap-4 flex-wrap">
          {/* Icône */}
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
          >
            {emoji}
          </div>

          <div className="flex-1 min-w-0">
            {/* Nom + badge chaîne */}
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1
                className="text-2xl font-extrabold"
                style={{ color: "var(--text)", letterSpacing: "-0.02em" }}
              >
                {cinema.nom}
              </h1>
              {cinema.chaine && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={chaineStyle}
                >
                  {cinema.chaine}
                </span>
              )}
            </div>

            {/* Adresse */}
            {cinema.adresse && (
              <p className="text-sm mb-1" style={{ color: "var(--text-3)" }}>
                📍{" "}
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    `${cinema.adresse} ${cinema.ville} ${cinema.codePostal}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline hover:underline"
                  style={{ color: "var(--text-3)" }}
                >
                  {cinema.adresse}
                  {cinema.ville ? `, ${cinema.ville}` : ""}
                  {cinema.codePostal ? ` ${cinema.codePostal}` : ""}
                </a>
              </p>
            )}

            {/* Téléphone */}
            {cinema.telephone && (
              <p className="text-sm mb-1" style={{ color: "var(--text-3)" }}>
                📞{" "}
                <a
                  href={`tel:${cinema.telephone}`}
                  className="no-underline"
                  style={{ color: "var(--text-3)" }}
                >
                  {cinema.telephone}
                </a>
              </p>
            )}

            {/* Liens */}
            <div className="flex flex-wrap gap-3 mt-3">
              <CinemaFavoriButton cinemaId={id} cinemaName={cinema.nom} />
              {bookingUrl && (
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold no-underline text-white transition-opacity hover:opacity-90"
                  style={{ background: "var(--red)", border: "none" }}
                >
                  🎟️ Réserver en ligne ↗
                </a>
              )}
              {cinema.siteWeb && cinema.siteWeb !== bookingUrl && (
                <a
                  href={cinema.siteWeb}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm no-underline"
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-2)",
                  }}
                >
                  🌐 Site officiel ↗
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Carte ──────────────────────────────────────── */}
      {cinema.latitude && cinema.longitude && (
        <div className="mb-8 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <MapCinema
            lat={cinema.latitude}
            lng={cinema.longitude}
            nom={cinema.nom}
          />
        </div>
      )}

      {/* ── Programme ──────────────────────────────────── */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
        {/* Titre + compteur */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-lg font-extrabold" style={{ color: "var(--text)" }}>
            Programme{" "}
            <span className="text-sm font-normal" style={{ color: "var(--text-3)" }}>
              {dateAffichee}
            </span>
          </h2>
          {totalSeances > 0 && (
            <span
              className="text-xs font-medium px-2 py-1 rounded-full"
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                color: "var(--text-3)",
              }}
            >
              {totalSeances} séance{totalSeances > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Navigation jours (client component) */}
        <ProgrammeNav cinemaId={id} currentDate={date} />

        {/* Séances */}
        {programme.length === 0 ? (
          <div
            className="text-center py-12 rounded-xl mt-4"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
          >
            <p className="text-3xl mb-3">🎞️</p>
            <p className="font-medium" style={{ color: "var(--text)" }}>
              Aucune séance {dateAffichee}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
              Le programme est mis à jour chaque matin.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-4">
            {programme.map((ligne) => (
              <SeanceGroupByFilm key={ligne.film.id} ligne={ligne} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
