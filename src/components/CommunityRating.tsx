"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Props {
  filmId: string;
}

/**
 * Note communauté CinéRadar — affiché sur la page d'un film.
 * Charge la note agrégée des avis utilisateurs en client-side
 * pour bénéficier du revalidate court (5 min) sans bloquer le SSR.
 */
export default function CommunityRating({ filmId }: Props) {
  const [data, setData] = useState<{ note: number | null; count: number } | null>(null);

  useEffect(() => {
    api.getFilmRating(filmId)
      .then(setData)
      .catch(() => setData({ note: null, count: 0 }));
  }, [filmId]);

  if (!data || data.note === null || data.count === 0) return null;

  // data.note est sur /5 (même échelle que le formulaire de notation)
  const stars = data.note; // directement /5
  const fullStars = Math.floor(stars);
  const halfStar = stars - fullStars >= 0.4;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  const noteOver10 = +(data.note * 2).toFixed(1); // conversion /5 → /10 pour affichage

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-lg"
      style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
      title={`Note CinéRadar : ${data.note.toFixed(1)}/5 (${noteOver10}/10) — ${data.count} avis`}
    >
      {/* Étoiles */}
      <div className="flex items-center gap-0.5" style={{ fontSize: 14 }}>
        {Array.from({ length: fullStars }).map((_, i) => (
          <span key={`f${i}`} style={{ color: "#e63946" }}>★</span>
        ))}
        {halfStar && <span style={{ color: "#e63946", opacity: 0.6 }}>★</span>}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <span key={`e${i}`} style={{ color: "var(--border)" }}>★</span>
        ))}
      </div>

      {/* Note textuelle */}
      <div>
        <span className="font-bold text-sm" style={{ color: "var(--text)" }}>
          {data.note.toFixed(1)}
          <span className="font-normal text-xs" style={{ color: "var(--text-3)" }}>/5</span>
        </span>
        <span className="text-xs ml-1.5" style={{ color: "var(--text-3)" }}>
          CinéRadar · {data.count} avis
        </span>
      </div>
    </div>
  );
}
