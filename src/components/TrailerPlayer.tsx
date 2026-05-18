"use client";

// ─────────────────────────────────────────────────────────
//  TrailerPlayer — gère le cas "embedding désactivé"
//
//  YouTube envoie un postMessage avec le code d'erreur 150 (ou 101)
//  quand l'embedding est bloqué par le propriétaire de la vidéo.
//  Dans ce cas on bascule sur le fallback affiche + lien YouTube.
// ─────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import Image from "next/image";

interface Props {
  youtubeId: string;
  filmTitre: string;
  filmAffiche: string | null;
  embedUrl: string;
  searchUrl: string;
}

export default function TrailerPlayer({
  youtubeId,
  filmTitre,
  filmAffiche,
  embedUrl,
  searchUrl,
}: Props) {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // YouTube postMessage quand embedding est désactivé
      // Format : JSON string { event: "onError", info: 150 }
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (
          data?.event === "onError" &&
          (data?.info === 150 || data?.info === 101)
        ) {
          setBlocked(true);
        }
      } catch {
        // ignore les messages non-JSON
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [youtubeId]);

  if (blocked) {
    return (
      <a
        href={searchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl overflow-hidden group"
        style={{ textDecoration: "none" }}
      >
        <div
          className="relative w-full rounded-xl overflow-hidden shadow-lg"
          style={{ paddingBottom: "56.25%", background: "#000" }}
        >
          {filmAffiche ? (
            <>
              <Image
                src={filmAffiche}
                alt={filmTitre}
                fill
                sizes="(max-width: 640px) 90vw, 850px"
                style={{ objectFit: "cover" }}
                unoptimized
              />
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                style={{ background: "rgba(0,0,0,0.6)" }}
              >
                <span className="text-white text-4xl">▶</span>
                <span className="text-white text-base font-semibold">
                  Voir la bande annonce sur YouTube ↗
                </span>
              </div>
            </>
          ) : (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              style={{ background: "var(--bg-2)" }}
            >
              <span className="text-4xl">🎬</span>
              <span className="font-semibold" style={{ color: "var(--text)" }}>
                Voir la bande annonce sur YouTube ↗
              </span>
            </div>
          )}
        </div>
      </a>
    );
  }

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden shadow-lg"
      style={{ paddingBottom: "56.25%", background: "#000" }}
    >
      <iframe
        src={embedUrl}
        title={`Bande annonce — ${filmTitre}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
        }}
      />
    </div>
  );
}
