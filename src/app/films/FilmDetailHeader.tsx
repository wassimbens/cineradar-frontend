"use client";

import { useRouter } from "next/navigation";

export default function FilmDetailHeader() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1 text-sm mb-8 no-underline transition-colors hover:brightness-125"
      style={{ color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
      title="Retour à la page précédente"
    >
      ← Retour
    </button>
  );
}
