import Link from "next/link";
import { Cinema } from "@/lib/api";

export default function CinemaCard({ cinema }: { cinema: Cinema }) {
  return (
    <Link href={`/cinemas/${cinema.id}`} className="no-underline">
      <div className="card cursor-pointer p-4" style={{ borderRadius: 10 }}>
        {/* En-tête */}
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
            style={{ background: "var(--red-dim)" }}
          >
            🎭
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-snug" style={{ color: "var(--text)" }}>
              {cinema.nom}
            </p>
            {cinema.chaine && (
              <p className="text-xs mt-0.5" style={{ color: "var(--red)" }}>
                {cinema.chaine}
              </p>
            )}
            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
              {[cinema.adresse, cinema.ville].filter(Boolean).join(", ")}
            </p>
          </div>
        </div>

        {/* Séances */}
        {(cinema.seancesAujourdhui ?? 0) > 0 && (
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <span className="badge-red">
              {cinema.seancesAujourdhui} séance{(cinema.seancesAujourdhui ?? 0) > 1 ? "s" : ""} aujourd&apos;hui
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
