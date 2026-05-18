import { MetadataRoute } from "next";
import { api } from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cineradar.fr";

export const revalidate = 3600; // regénère toutes les heures

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── Pages statiques ───────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL,                       lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${SITE_URL}/films`,            lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${SITE_URL}/films/classiques`, lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${SITE_URL}/recherche`,        lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${SITE_URL}/alertes`,          lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/a-propos`,         lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  // ── Pages films dynamiques (tous les films) ───────────────
  let filmPages: MetadataRoute.Sitemap = [];
  try {
    // Récupère tous les films sans limite (fix: empty query = no take limit)
    const films = await api.getAllFilms();
    filmPages = films.map((film) => ({
      url: `${SITE_URL}/films/${film.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch { /* silencieux si le backend est inaccessible */ }

  // ── Pages cinémas dynamiques ──────────────────────────────
  let cinemaPages: MetadataRoute.Sitemap = [];
  try {
    // Requête sans filtre ville pour tout récupérer
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/cinemas`);
    if (res.ok) {
      const cinemas = await res.json() as { id: string }[];
      cinemaPages = cinemas.map((cinema) => ({
        url: `${SITE_URL}/cinemas/${cinema.id}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.7,
      }));
    }
  } catch { /* silencieux */ }

  return [...staticPages, ...filmPages, ...cinemaPages];
}
