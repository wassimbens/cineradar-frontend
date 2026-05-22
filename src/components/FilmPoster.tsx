"use client";

import { useState } from "react";
import Image from "next/image";

// ── Gradient déterministe à partir du titre ───────────────

const GRADIENTS = [
  ["#1a1a2e", "#e94560"],   // dark + red
  ["#0d1b2a", "#1b4332"],   // midnight + forest
  ["#2d1b69", "#11998e"],   // violet + teal
  ["#2c3e50", "#3498db"],   // navy + blue
  ["#4a1942", "#c84b31"],   // dark purple + orange
  ["#1a2a1a", "#52b788"],   // dark + green
  ["#2d3436", "#6c5ce7"],   // charcoal + purple
  ["#1e1e2e", "#f72585"],   // dark + pink
];

function titleGradient(titre: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < titre.length; i++) {
    hash = ((hash << 5) - hash) + titre.charCodeAt(i);
    hash |= 0;
  }
  const g = GRADIENTS[Math.abs(hash) % GRADIENTS.length];
  return [g[0], g[1]];
}

function initials(titre: string): string {
  return titre
    .replace(/^(le |la |les |l'|un |une |the |a )/i, "")
    .trim()
    .charAt(0)
    .toUpperCase();
}

// ── Composant ─────────────────────────────────────────────

interface Props {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
}

export default function FilmPoster({
  src,
  alt,
  fill = false,
  width,
  height,
  sizes,
  className,
  priority,
}: Props) {
  const [errored, setErrored] = useState(false);

  const showPlaceholder = !src || errored;
  const [from, to] = titleGradient(alt);

  if (showPlaceholder) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center select-none"
        style={{
          background: `linear-gradient(160deg, ${from} 0%, ${to} 100%)`,
          minHeight: fill ? undefined : height,
        }}
      >
        {/* Grande initiale */}
        <span
          className="font-extrabold"
          style={{
            fontSize: "clamp(2rem, 8cqw, 4rem)",
            color: "rgba(255,255,255,0.85)",
            lineHeight: 1,
            letterSpacing: "-0.03em",
            textShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          {initials(alt)}
        </span>
        {/* Titre tronqué */}
        <span
          className="text-center px-2 mt-2 leading-snug"
          style={{
            fontSize: "clamp(0.55rem, 2.5cqw, 0.7rem)",
            color: "rgba(255,255,255,0.6)",
            maxWidth: "90%",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {alt}
        </span>
      </div>
    );
  }

  // Images externes (TMDB, CDN cinémas) → pas d'optimisation Vercel
  // Évite de consommer le quota Image Optimization du plan gratuit
  const isExternal = src.startsWith("http://") || src.startsWith("https://");

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className ?? "object-cover"}
        sizes={sizes}
        priority={priority}
        unoptimized={isExternal}
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 140}
      height={height ?? 210}
      className={className ?? "object-cover w-full h-full"}
      sizes={sizes}
      priority={priority}
      unoptimized={isExternal}
      onError={() => setErrored(true)}
    />
  );
}
