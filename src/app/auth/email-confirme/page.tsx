import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Email confirmé — CinéRadar",
};

export default function EmailConfirmePage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg)" }}
    >
      <div className="text-center max-w-md">
        <div className="text-6xl mb-5">🎉</div>
        <h1
          className="text-3xl font-extrabold mb-3"
          style={{ color: "var(--text)", letterSpacing: "-0.02em" }}
        >
          Email confirmé !
        </h1>
        <p className="text-base mb-8 leading-relaxed" style={{ color: "var(--text-2)" }}>
          Votre adresse email est maintenant vérifiée. Vous pouvez profiter de
          toutes les fonctionnalités de CinéRadar.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/films"
            className="inline-block px-6 py-3 rounded-xl font-bold text-white text-center"
            style={{ background: "var(--red)" }}
          >
            Découvrir les films
          </Link>
          <Link
            href="/profil"
            className="inline-block px-6 py-3 rounded-xl font-bold text-center"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          >
            Mon profil
          </Link>
        </div>
      </div>
    </div>
  );
}
