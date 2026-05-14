import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — CinéRadar",
  robots: { index: false },
};

export default function CguPage() {
  return (
    <div className="px-6 py-14 mx-auto" style={{ maxWidth: 760 }}>
      <h1 style={{ color: "var(--text)", fontWeight: 800, fontSize: "1.75rem", marginBottom: "2rem" }}>
        Conditions générales d&apos;utilisation
      </h1>
      <p style={{ color: "var(--text-3)", fontSize: "0.85rem", marginBottom: "2rem" }}>
        En vigueur au 1er mai 2026
      </p>

      {[
        {
          titre: "1. Présentation du service",
          contenu: `CinéRadar est un service en ligne permettant de consulter les programmes et séances de cinéma en France, de gérer un profil cinéphile (watchlist, films vus, avis) et de créer des alertes email pour être notifié de séances à venir.`,
        },
        {
          titre: "2. Accès au service",
          contenu: `L'accès aux fonctionnalités de base (consultation des séances et du catalogue) est gratuit et sans inscription.
La création d'un compte est nécessaire pour les fonctionnalités personnalisées (alertes, profil, watchlist).
CinéRadar se réserve le droit de suspendre ou de supprimer un compte en cas d'utilisation abusive.`,
        },
        {
          titre: "3. Obligations de l'utilisateur",
          contenu: `L'utilisateur s'engage à :
• Fournir des informations exactes lors de l'inscription
• Ne pas tenter de compromettre la sécurité du service
• Ne pas utiliser le service à des fins commerciales sans autorisation écrite
• Respecter les droits des autres utilisateurs
• Ne pas publier d'avis offensants, diffamatoires ou inappropriés`,
        },
        {
          titre: "4. Propriété intellectuelle",
          contenu: `Le code source, le design et les contenus originaux de CinéRadar sont la propriété de l'éditeur. Les données de séances et d'affiches proviennent de sources tierces et restent la propriété de leurs détenteurs respectifs.`,
        },
        {
          titre: "5. Exactitude des informations",
          contenu: `CinéRadar s'efforce de maintenir des informations à jour, mais ne peut garantir l'exactitude des horaires. Nous vous recommandons de toujours confirmer sur le site du cinéma avant de vous déplacer.`,
        },
        {
          titre: "6. Disponibilité du service",
          contenu: `CinéRadar est fourni "en l'état". Nous ne garantissons pas une disponibilité ininterrompue. Des maintenances peuvent occasionner des interruptions temporaires.`,
        },
        {
          titre: "7. Suspension de compte",
          contenu: `CinéRadar se réserve le droit de suspendre ou supprimer tout compte sans préavis en cas de violation des présentes CGU, d'utilisation frauduleuse ou d'activité suspecte.`,
        },
        {
          titre: "8. Modification des CGU",
          contenu: `CinéRadar peut modifier les présentes CGU à tout moment. Les utilisateurs seront notifiés par email des modifications substantielles. La poursuite de l'utilisation du service après notification vaut acceptation des nouvelles conditions.`,
        },
        {
          titre: "9. Droit applicable",
          contenu: `Les présentes CGU sont soumises au droit français. Tout litige sera soumis à la compétence des tribunaux français.`,
        },
      ].map((section) => (
        <section key={section.titre} className="mb-8">
          <h2 style={{ color: "var(--text)", fontWeight: 700, fontSize: "1.05rem", marginBottom: ".75rem" }}>
            {section.titre}
          </h2>
          <p style={{ color: "var(--text-2)", lineHeight: 1.8, fontSize: "0.9rem", whiteSpace: "pre-line" }}>
            {section.contenu}
          </p>
        </section>
      ))}

      <div className="mt-10 p-4 rounded-xl" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          Questions sur les CGU ? Contactez-nous : <a href="mailto:contact@cineradar.fr" style={{ color: "var(--red)" }}>contact@cineradar.fr</a>
        </p>
      </div>
    </div>
  );
}
