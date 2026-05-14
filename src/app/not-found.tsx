import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page introuvable — CinéRadar",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center text-center px-6"
      style={{ minHeight: "70vh" }}
    >
      {/* Icône animée */}
      <div className="mb-6" style={{ fontSize: 64 }}>🎬</div>

      <p
        className="text-8xl font-extrabold mb-2"
        style={{ color: "var(--red)", letterSpacing: "-0.04em", lineHeight: 1 }}
      >
        404
      </p>
      <h1 className="text-2xl font-extrabold mb-3" style={{ color: "var(--text)" }}>
        Cette page n&apos;existe pas
      </h1>
      <p className="text-sm mb-8 max-w-sm leading-relaxed" style={{ color: "var(--text-3)" }}>
        Le film, le cinéma ou la page que vous cherchez est introuvable —
        peut-être a-t-il quitté l&apos;affiche&nbsp;?
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/"
          className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white no-underline"
          style={{ background: "var(--red)" }}
        >
          ← Accueil
        </Link>
        <Link
          href="/films"
          className="px-5 py-2.5 rounded-lg text-sm font-semibold no-underline"
          style={{ background: "var(--bg-2)", color: "var(--text)", border: "1px solid var(--border)" }}
        >
          Catalogue films
        </Link>
        <Link
          href="/recherche"
          className="px-5 py-2.5 rounded-lg text-sm font-semibold no-underline"
          style={{ background: "var(--bg-2)", color: "var(--text)", border: "1px solid var(--border)" }}
        >
          🔍 Rechercher
        </Link>
      </div>
    </div>
  );
}
