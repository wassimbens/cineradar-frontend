"use client";

import { useState } from "react";

const LIMITE = 220;

export default function SynopsisCollapsible({ texte }: { texte: string }) {
  const [ouvert, setOuvert] = useState(false);
  const court = texte.length > LIMITE;

  return (
    <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-2)" }}>
      {court && !ouvert ? `${texte.slice(0, LIMITE).trimEnd()}…` : texte}
      {court && (
        <button
          onClick={() => setOuvert(!ouvert)}
          className="ml-1 font-medium underline underline-offset-2 bg-transparent border-0 cursor-pointer"
          style={{ color: "var(--red)", fontSize: "inherit" }}
        >
          {ouvert ? "Réduire" : "Lire la suite"}
        </button>
      )}
    </p>
  );
}
