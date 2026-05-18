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
  description:
    "Tous les cinémas français, tous les films, en un seul endroit.",
  author: {
    "@type": "Person",
    name: "Wassim BEN SLIMENE",
  },
};

export default function AProposPage() {
  return (
    <div className="px-6 py-14 mx-auto" style={{ maxWidth: 760 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* En-tête */}
      <div className="mb-12">
        <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--red)" }}>
          À propos
        </p>
        <h1 className="text-4xl font-extrabold mb-4" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
          Ciné<span style={{ color: "var(--red)" }}>Radar</span>
        </h1>
        <p className="text-lg leading-relaxed" style={{ color: "var(--text-2)" }}>
          Tous les cinémas français, tous les films — en un seul endroit.
        </p>
      </div>

      {/* Le projet */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>Le projet</h2>
        <div className="space-y-4 text-base leading-relaxed" style={{ color: "var(--text-2)" }}>
          <p>
            CinéRadar est né d&apos;une frustration simple : trouver les séances d&apos;un film en salle
            impliquait de jongler entre les sites UGC, Pathé, MK2 et AlloCiné — chacun avec
            son propre format, ses filtres limités, ses pubs.
          </p>
          <p>
            L&apos;idée : un seul endroit, propre et rapide, qui agrège les programmes de
            toutes les chaînes et des cinémas indépendants, avec des filtres utiles,
            un profil cinéphile et des alertes email.
          </p>
        </div>
      </section>

      {/* Ce qu'on fait */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text)" }}>Ce que fait CinéRadar</h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {[
            { emoji: "🎬", titre: "Séances en temps réel", desc: "Horaires mis à jour chaque semaine depuis les sites officiels des cinémas." },
            { emoji: "🔔", titre: "Alertes personnalisées", desc: "Soyez notifié par email dès qu'un film passe dans un cinéma near you." },
            { emoji: "⭐", titre: "Profil cinéphile", desc: "Watchlist, films vus, avis, notes — construisez votre historique cinéma." },
            { emoji: "🗺️", titre: "Tous les cinémas", desc: "UGC, Pathé, Gaumont, MK2, CGR et des centaines de cinémas indépendants." },
          ].map((item) => (
            <div
              key={item.titre}
              className="p-5 rounded-2xl"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
            >
              <div className="text-2xl mb-2">{item.emoji}</div>
              <p className="font-semibold mb-1 text-sm" style={{ color: "var(--text)" }}>{item.titre}</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Les données */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>Les données</h2>
        <div className="space-y-3 text-base leading-relaxed" style={{ color: "var(--text-2)" }}>
          <p>
            Les séances sont collectées automatiquement chaque semaine depuis les sites
            officiels des cinémas. Les affiches, synopsis, notes et informations sur les films
            proviennent de l&apos;API{" "}
            <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--red)" }}>
              TMDB (The Movie Database)
            </a>{" "}
            et de{" "}
            <a href="https://www.imdb.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--red)" }}>
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
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>Qui fait ça ?</h2>
        <div className="text-base leading-relaxed" style={{ color: "var(--text-2)" }}>
          <p>
            CinéRadar est un projet indépendant développé par{" "}
            <strong style={{ color: "var(--text)" }}>Wassim BEN SLIMENE</strong>,
            développeur passionné de cinéma basé en France.
            Le projet est construit avec Next.js, Fastify et PostgreSQL.
          </p>
        </div>
      </section>

      {/* Contact + liens */}
      <section className="p-6 rounded-2xl" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
        <h2 className="text-base font-bold mb-4" style={{ color: "var(--text)" }}>Contact & liens</h2>
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
