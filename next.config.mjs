/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org",          pathname: "/t/p/**" },
      { protocol: "https", hostname: "img.youtube.com",         pathname: "/vi/**" },
      { protocol: "https", hostname: "m.media-amazon.com",      pathname: "/images/**" },
      { protocol: "https", hostname: "ia.media-imdb.com",       pathname: "/**" },
      { protocol: "https", hostname: "www.ugc.fr",              pathname: "/dynamique/**" },
      { protocol: "https", hostname: "**.allocine.fr" },
      { protocol: "https", hostname: "**.pathe.com" },
      { protocol: "https", hostname: "**.mk2.com" },
      { protocol: "https", hostname: "**.omdbapi.com" },
      // Fallback générique pour toute source HTTPS (images web)
      { protocol: "https", hostname: "**" },
    ],
  },

  // En-têtes de sécurité sur toutes les routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "X-Frame-Options",         value: "SAMEORIGIN" },
          { key: "X-XSS-Protection",        value: "1; mode=block" },
          { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          // HSTS — activé uniquement en production via reverse proxy Nginx
          // { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
      // Cache agressif pour les assets statiques hachés
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Cache sur les icônes PWA
      {
        source: "/icons/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=3600" },
        ],
      },
    ];
  },
};

export default nextConfig;
