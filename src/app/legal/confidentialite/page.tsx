import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — CinéRadar",
  robots: { index: false },
};

export default function ConfidentialitePage() {
  return (
    <div className="px-6 py-14 mx-auto" style={{ maxWidth: 760 }}>
      <h1 style={{ color: "var(--text)", fontWeight: 800, fontSize: "1.75rem", marginBottom: "2rem" }}>
        Politique de confidentialité
      </h1>
      <p style={{ color: "var(--text-3)", fontSize: "0.85rem", marginBottom: "2rem" }}>
        Dernière mise à jour : mai 2026
      </p>

      {[
        {
          titre: "1. Responsable du traitement",
          contenu: `Wassim BEN SLIMENE, éditeur de CinéRadar (cineradar.fr).
Contact DPO : contact@cineradar.fr`,
        },
        {
          titre: "2. Données collectées",
          contenu: `Lors de la création d'un compte :
• Adresse email (obligatoire)
• Pseudo / nom (optionnel)
• Ville préférée (optionnel)
• Genres cinématographiques préférés (optionnel)

Lors de l'utilisation du service :
• Films favoris, watchlist, avis et notes
• Films vus en salle
• Cinémas favoris
• Alertes de séances créées

Données techniques automatiques :
• Adresse IP (logs serveur, conservation 30 jours)
• Navigateur et système d'exploitation (anonymisés)`,
        },
        {
          titre: "3. Finalités des traitements",
          contenu: `• Fonctionnement du compte utilisateur (base légale : exécution du contrat)
• Envoi d'emails de confirmation et d'alertes de séances (base légale : exécution du contrat)
• Amélioration du service (base légale : intérêt légitime)
• Statistiques agrégées anonymisées (base légale : intérêt légitime)`,
        },
        {
          titre: "4. Durée de conservation",
          contenu: `• Données de compte : conservées pendant toute la durée d'activité du compte,
  puis supprimées dans les 30 jours suivant la demande de suppression.
• Logs serveur (IP) : 30 jours maximum.
• Emails d'alertes : historique conservé 1 an.`,
        },
        {
          titre: "5. Partage des données",
          contenu: `CinéRadar ne vend ni ne partage vos données personnelles avec des tiers à des fins commerciales.
Sous-traitants techniques :
• Hetzner Online GmbH (hébergement, Allemagne — RGPD)
• Resend Inc. (envoi d'emails transactionnels)
Ces prestataires traitent vos données uniquement pour le service rendu et sont soumis à des obligations contractuelles strictes de confidentialité.`,
        },
        {
          titre: "6. Vos droits (RGPD)",
          contenu: `Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez des droits suivants :
• Droit d'accès à vos données
• Droit de rectification
• Droit à l'effacement ("droit à l'oubli")
• Droit à la portabilité
• Droit d'opposition
• Droit de limitation du traitement

Pour exercer vos droits : contact@cineradar.fr
En cas de litige, vous pouvez saisir la CNIL : www.cnil.fr`,
        },
        {
          titre: "7. Cookies",
          contenu: `CinéRadar utilise uniquement les cookies strictement nécessaires au fonctionnement du service :
• Session d'authentification (cookie httpOnly, durée : 30 jours)
• Préférences de thème (localStorage, aucune donnée personnelle)

Aucun cookie publicitaire ou de tracking n'est déposé sans votre consentement.`,
        },
        {
          titre: "8. Sécurité",
          contenu: `Les mots de passe sont stockés sous forme hachée (bcrypt, coût 12). Les communications sont chiffrées via HTTPS/TLS. L'accès aux données est restreint au personnel technique strictement nécessaire.`,
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
    </div>
  );
}
