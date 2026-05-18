import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "À propos — CinéRadar",
  description:
    "CinéRadar est un outil indépendant qui agrège les séances de cinéma de toute la France — UGC, Pathé, MK2, CGR et cinémas indépendants — en un seul endroit.",
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cineradar.fr";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "CinéRadar",
  url: SITE_URL,
  description: "Tous les cinémas français, tous les films, en un seul endroit.",
  author: { "@type": "Organization", name: "L'équipe CinéRadar" },
};

const FEATURES = [
  {
    emoji: "🎬",
    titre: "Séances en temps réel",
    desc: "Horaires mis à jour chaque semaine depuis les sites officiels des cinémas.",
  },
  {
    emoji: "🔔",
    titre: "Alertes personnalisées",
    desc: "Soyez notifié par email dès qu'un film passe dans un cinéma près de chez vous.",
  },
  {
    emoji: "⭐",
    titre: "Profil cinéphile",
    desc: "Watchlist, films vus, avis, notes — construisez votre historique cinéma.",
  },
  {
    emoji: "🗺️",
    titre: "Tous les cinémas",
    desc: "UGC, Pathé, Gaumont, MK2, CGR et des centaines de cinémas indépendants.",
  },
];

export default function AProposPage() {
  return (
    <div className="px-6 py-14 mx-auto" style={{ maxWidth: 780 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* En-tête */}
      <div className="mb-14">
        <p
          className="text-xs font-bold uppercase tracking-widest mb-4"
          style={{ color: "var(--red)" }}
        >
          À propos
        </p>
        <h1
          className="text-4xl sm:text-5xl font-extrabold mb-5 leading-tight"
          style={{ color: "var(--text)", letterSpacing: "-0.03em" }}
        >
          Ciné<span style={{ color: "var(--red)" }}>Radar</span>
        </h1>
        <p className="text-lg leading-relaxed" style={{ color: "var(--text-2)", maxWidth: 560 }}>
          Tous les cinémas français, tous les films —{" "}
          <span style={{ color: "var(--text)" }}>en un seul endroit.</span>
        </p>
      </div>

      {/* Le projet */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-5" style={{ color: "var(--text)" }}>
          Le projet
        </h2>
        <div className="space-y-4 text-base leading-relaxed" style={{ color: "var(--text-2)" }}>
          <p>
            CinéRadar est né d&apos;une frustration simple : trouver les séances d&apos;un film
            impliquait de jongler entre les sites UGC, Pathé, MK2 et AlloCiné — chacun avec
            son propre format, ses filtres limités, ses publicités.
          </p>
          <p>
            L&apos;idée : un seul endroit, propre et rapide, qui agrège les programmes de
            toutes les chaînes et des cinémas indépendants, avec des filtres utiles,
            un profil cinéphile et des alertes email.
          </p>
        </div>
      </section>

      {/* 4 fonctionnalités — grille 2×2 */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text)" }}>
          Ce que fait CinéRadar
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((item) => (
            <div
              key={item.titre}
              className="p-5 rounded-2xl flex flex-col gap-2"
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "1.75rem", lineHeight: 1 }}>{item.emoji}</div>
              <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                {item.titre}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Les données */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-5" style={{ color: "var(--text)" }}>
          Les données
        </h2>
        <div className="space-y-4 text-base leading-relaxed" style={{ color: "var(--text-2)" }}>
          <p>
            Les séances sont collectées automatiquement chaque semaine depuis les sites
            officiels des cinémas. Les affiches, synopsis, notes et informations sur les films
            proviennent de l&apos;API{" "}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--red)" }}
            >
              TMDB (The Movie Database)
            </a>{" "}
            et de{" "}
            <a
              href="https://www.imdb.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--red)" }}
            >
              IMDb
            </a>.
          </p>
          <p>
            CinéRadar n&apos;est affilié à aucune chaîne de cinéma. Les données de séances
            sont utilisées dans un cadre informatif. Nous recommandons toujours de
            vérifier les horaires sur le site du cinéma avant de vous déplacer.
          </p>
        </div>
      </section>

      {/* Qui */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-5" style={{ color: "var(--text)" }}>
          Qui sommes-nous ?
        </h2>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-2)" }}>
          CinéRadar est un projet indépendant porté par{" "}
          <strong style={{ color: "var(--text)" }}>l&apos;équipe CinéRadar</strong>,
          des passionnés de cinéma basés en France. Le site est construit avec
          Next.js, Fastify et PostgreSQL.
        </p>
      </section>

      {/* Contact */}
      <section
        className="p-6 rounded-2xl"
        style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-base font-bold mb-4" style={{ color: "var(--text)" }}>
          Contact &amp; liens
        </h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "📧 contact@cineradar.fr", href: "mailto:contact@cineradar.fr" },
            { label: "📄 Mentions légales",      href: "/legal/mentions-legales" },
            { label: "🔒 Confidentialité",       href: "/legal/confidentialite" },
            { label: "📋 CGU",                   href: "/legal/cgu" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-4 py-2 rounded-xl text-sm no-underline"
              style={{
                background: "var(--bg-3)",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
