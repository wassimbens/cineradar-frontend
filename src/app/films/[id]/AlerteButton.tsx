"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import AlerteModal from "@/components/AlerteModal";

export default function AlerteButton({ filmTitre }: { filmTitre: string }) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  // Pré-remplit la ville avec le filtre en cours (ou vide si "toutes les villes")
  const ville = searchParams.get("ville") ?? "";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
        style={{ background: "var(--red)", border: "none", cursor: "pointer" }}
      >
        🔔 Créer une alerte
      </button>
      {open && (
        <AlerteModal
          filmTitre={filmTitre}
          defaultVille={ville}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
