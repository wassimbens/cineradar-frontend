import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import CookieBanner from "@/components/CookieBanner";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cineradar.fr";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CinéRadar — Tous les cinémas, tous les films",
    template: "%s — CinéRadar",
  },
  description:
    "Trouvez les séances de cinéma près de chez vous : UGC, Pathé, MK2 et cinémas indépendants. Créez des alertes pour être notifié dès qu'un film passe près de vous.",
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "CinéRadar",
    title: "CinéRadar — Tous les cinémas, tous les films",
    description:
      "Trouvez les séances de cinéma près de chez vous. UGC, Pathé, MK2 et indépendants — tout en un seul endroit.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "CinéRadar" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@cineradar_fr",
    title: "CinéRadar — Tous les cinémas, tous les films",
    description:
      "Séances de cinéma, alertes et catalogue — UGC, Pathé, MK2 et indépendants.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CinéRadar",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#e63946",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Script inline pour éviter le flash de thème au chargement */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var theme = stored || (prefersDark ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-theme', theme);
                } catch(e) {}
              })();
            `,
          }}
        />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
        <meta name="theme-color" content="#e63946" />
        {/* Enregistrement du service worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </head>
      <body className={inter.className} style={{ minHeight: "100vh" }}>
        <Navbar />
        <main>{children}</main>
        <CookieBanner />

        {/* Footer */}
        <footer
          className="mt-20 pt-10 pb-8"
          style={{
            borderTop: "1px solid var(--border)",
            color: "var(--text-3)",
          }}
        >
          <div
            className="px-6 mx-auto flex flex-wrap gap-10 justify-between mb-8"
            style={{ maxWidth: 1100 }}
          >
            {/* Logo */}
            <div>
              <p className="font-extrabold text-base mb-2" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
                Ciné<span style={{ color: "var(--red)" }}>Radar</span>
              </p>
              <p className="text-xs leading-relaxed" style={{ maxWidth: 220 }}>
                Tous les cinémas, tous les films —<br />
                UGC, Pathé, MK2 et indépendants.
              </p>
            </div>

            {/* Liens */}
            <div className="flex gap-6 sm:gap-12 flex-wrap">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-2)" }}>
                  Films
                </p>
                <ul className="space-y-2 text-xs list-none p-0 m-0">
                  {[
                    { label: "Catalogue",   href: "/films" },
                    { label: "Classiques",  href: "/films/classiques" },
                    { label: "Recherche",   href: "/recherche?type=films" },
                  ].map((l) => (
                    <li key={l.href}>
                      <a href={l.href} className="no-underline hover:underline" style={{ color: "var(--text-3)" }}>
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-2)" }}>
                  Cinémas
                </p>
                <ul className="space-y-2 text-xs list-none p-0 m-0">
                  {[
                    { label: "Tous les cinémas", href: "/recherche?type=cinemas" },
                    { label: "Créer une alerte", href: "/alertes" },
                  ].map((l) => (
                    <li key={l.href}>
                      <a href={l.href} className="no-underline hover:underline" style={{ color: "var(--text-3)" }}>
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Copyright + liens légaux */}
          <div
            className="px-6 mx-auto flex flex-wrap items-center justify-between gap-2 text-xs"
            style={{ maxWidth: 1100, borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}
          >
            <p>© {new Date().getFullYear()} CinéRadar · Données issues des sites officiels · Mise à jour chaque mercredi</p>
            <div className="flex gap-4 flex-wrap">
              {[
                { label: "Mentions légales",    href: "/legal/mentions-legales" },
                { label: "Confidentialité",     href: "/legal/confidentialite" },
                { label: "CGU",                 href: "/legal/cgu" },
                { label: "Contact",             href: "mailto:contact@cineradar.fr" },
              ].map((l) => (
                <a key={l.href} href={l.href} className="no-underline hover:underline" style={{ color: "var(--text-3)" }}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
