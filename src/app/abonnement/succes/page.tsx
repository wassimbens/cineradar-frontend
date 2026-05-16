"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AbonnementSucces() {
  // Forcer un rechargement du profil pour que isPremium soit à jour
  useEffect(() => {
    localStorage.removeItem("cineradar_profil_cache");
  }, []);

  return (
    <div className="px-6 py-24 mx-auto text-center" style={{ maxWidth: 480 }}>
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl"
        style={{ background: "#dcfce7" }}
      >
        🎬
      </div>
      <h1 className="text-3xl font-extrabold mb-3" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
        Bienvenue dans le Pro !
      </h1>
      <p className="text-base mb-8" style={{ color: "var(--text-3)", lineHeight: 1.6 }}>
        Votre abonnement CinéRadar Pro est actif. Toutes les fonctionnalités sont maintenant débloquées.
      </p>
      <div className="flex flex-col gap-3 items-center">
        <Link
          href="/profil"
          className="px-8 py-3 rounded-xl text-sm font-bold text-white no-underline"
          style={{ background: "var(--red)" }}
        >
          Découvrir mon profil Pro
        </Link>
        <Link
          href="/"
          className="text-sm no-underline"
          style={{ color: "var(--text-3)" }}
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
