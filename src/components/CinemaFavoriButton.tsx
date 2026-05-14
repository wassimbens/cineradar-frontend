"use client";

import { useState, useEffect } from "react";
import { profilApi } from "@/lib/api";

interface Props {
  cinemaId: string;
  cinemaName: string;
}

export default function CinemaFavoriButton({ cinemaId, cinemaName }: Props) {
  const [email, setEmail] = useState<string | null>(null);
  const [isFavori, setIsFavori] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const mail = localStorage.getItem("cineradar_email");
    setEmail(mail);
    if (!mail) { setLoaded(true); return; }

    profilApi.getProfil(mail)
      .then((p) => {
        setIsFavori(p.cinemasFavoris.some((c) => c.id === cinemaId));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [cinemaId]);

  if (!loaded) return null;

  if (!email) {
    return (
      <a
        href="/profil"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm no-underline"
        style={{
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
          color: "var(--text-3)",
        }}
      >
        🏛️ Connectez-vous pour sauvegarder
      </a>
    );
  }

  const toggle = async () => {
    setSaving(true);
    try {
      if (isFavori) {
        await profilApi.removeCinema(email, cinemaId);
        setIsFavori(false);
      } else {
        await profilApi.addCinema(email, cinemaId);
        setIsFavori(true);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
      style={{
        background: isFavori ? "var(--red)" : "var(--bg-2)",
        color: isFavori ? "white" : "var(--text-2)",
        border: `1px solid ${isFavori ? "var(--red)" : "var(--border)"}`,
        cursor: saving ? "not-allowed" : "pointer",
        opacity: saving ? 0.7 : 1,
      }}
      title={isFavori ? `Retirer ${cinemaName} de mes cinémas` : `Ajouter ${cinemaName} à mes cinémas`}
    >
      {isFavori ? "🏛️" : "🏛️"} {isFavori ? "Sauvegardé" : "Sauvegarder ce cinéma"}
    </button>
  );
}
