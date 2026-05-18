import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales — CinéRadar",
  robots: { index: false },
};

export default function MentionsLegalesPage() {
  return (
    <div className="px-6 py-14 mx-auto prose-custom" style={{ maxWidth: 760 }}>
      <h1 style={{ color: "var(--text)", fontWeight: 800, fontSize: "1.75rem", marginBottom: "2rem" }}>
        Mentions légales
      </h1>

      <section className="mb-8">
        <h2 style={{ color: "var(--text)", fontWeight: 700, fontSize: "1.1rem", marginBottom: ".75rem" }}>
          Éditeur du site
        </h2>
        <p style={{ color: "var(--text-2)", lineHeight: 1.8, fontSize: "0.9rem" }}>
          Le site <strong>CinéRadar</strong> (cineradar.fr) est édité par :<br /><br />
          <strong>L&apos;équipe CinéRadar</strong><br />
          Auto-entrepreneur<br />
          SIRET : <em>en cours d&apos;enregistrement</em><br />
          Contact : <a href="mailto:contact@cineradar.fr" style={{ color: "var(--red)" }}>contact@cineradar.fr</a>
        </p>
      </section>

      <section className="mb-8">
        <h2 style={{ color: "var(--text)", fontWeight: 700, fontSize: "1.1rem", marginBottom: ".75rem" }}>
          Hébergement
        </h2>
        <p style={{ color: "var(--text-2)", lineHeight: 1.8, fontSize: "0.9rem" }}>
          Le frontend est hébergé par :<br /><br />
          <strong>Vercel Inc.</strong><br />
          440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br />
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--red)" }}>
            vercel.com
          </a><br /><br />

          Le backend et la base de données sont hébergés par :<br /><br />
          <strong>Railway Corp.</strong><br />
          San Francisco, CA, États-Unis<br />
          <a href="https://railway.app" target="_blank" rel="noopener noreferrer" style={{ color: "var(--red)" }}>
            railway.app
          </a>
        </p>
      </section>

      <section className="mb-8">
        <h2 style={{ color: "var(--text)", fontWeight: 700, fontSize: "1.1rem", marginBottom: ".75rem" }}>
          Propriété intellectuelle
        </h2>
        <p style={{ color: "var(--text-2)", lineHeight: 1.8, fontSize: "0.9rem" }}>
          Les données de séances sont issues des sites officiels des cinémas dans le cadre d&apos;un
          usage informatif. Les affiches et informations films proviennent de l&apos;API TMDB
          (The Movie Database). CinéRadar n&apos;est pas affilié à ces entités.
        </p>
      </section>

      <section className="mb-8">
        <h2 style={{ color: "var(--text)", fontWeight: 700, fontSize: "1.1rem", marginBottom: ".75rem" }}>
          Limitation de responsabilité
        </h2>
        <p style={{ color: "var(--text-2)", lineHeight: 1.8, fontSize: "0.9rem" }}>
          CinéRadar s&apos;efforce d&apos;assurer l&apos;exactitude des informations présentées mais ne peut garantir
          l&apos;absence d&apos;erreurs. Les horaires de séances sont susceptibles de varier ; nous vous recommandons
          de vérifier sur le site du cinéma avant tout déplacement.
        </p>
      </section>

      <section>
        <h2 style={{ color: "var(--text)", fontWeight: 700, fontSize: "1.1rem", marginBottom: ".75rem" }}>
          Droit applicable
        </h2>
        <p style={{ color: "var(--text-2)", lineHeight: 1.8, fontSize: "0.9rem" }}>
          Le présent site est soumis au droit français. Tout litige relatif à son utilisation sera
          soumis à la compétence exclusive des tribunaux français.
        </p>
      </section>
    </div>
  );
}
