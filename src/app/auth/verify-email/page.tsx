// Page de vérification d'email — Next.js redirige vers ce composant
// quand l'utilisateur clique sur le lien dans son email.
// Le backend gère la vérification et redirige vers /auth/email-confirme
// (ou affiche une erreur en query param).

import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Vérification email — CinéRadar",
};

interface Props {
  searchParams: Promise<{ token?: string; error?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token, error } = await searchParams;

  // Si erreur retournée par le backend (token invalide/expiré)
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-extrabold mb-3" style={{ color: "var(--text)" }}>
            Lien invalide
          </h1>
          <p className="mb-6" style={{ color: "var(--text-2)" }}>
            Ce lien de confirmation est invalide ou a expiré (24h maximum).
          </p>
          <Link
            href="/profil"
            className="inline-block px-6 py-3 rounded-xl font-bold text-white"
            style={{ background: "var(--red)" }}
          >
            Renvoyer un email de confirmation
          </Link>
        </div>
      </div>
    );
  }

  // Si pas de token : page intermédiaire qui renvoie l'utilisateur
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-extrabold mb-3" style={{ color: "var(--text)" }}>
            Vérifiez votre email
          </h1>
          <p className="mb-6" style={{ color: "var(--text-2)" }}>
            Un email de confirmation a été envoyé à votre adresse. Cliquez sur le lien
            dans cet email pour activer votre compte.
          </p>
          <Link href="/" style={{ color: "var(--red)" }}>
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  // Redirige vers le backend qui valide le token
  // (le backend fait lui-même la redirection vers /auth/email-confirme)
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <p style={{ color: "var(--text-2)" }}>Vérification en cours…</p>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.href = "${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/auth/verify-email?token=${token}";`,
        }}
      />
    </div>
  );
}
