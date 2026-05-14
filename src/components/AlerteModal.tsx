"use client";
import { useState } from "react";

interface Props {
  filmTitre?: string;
  /** Ville pré-remplie (issue du filtre séances en cours) */
  defaultVille?: string;
  onClose: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

export default function AlerteModal({ filmTitre = "", defaultVille = "", onClose }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    filmTitre,
    email: "",
    ville: defaultVille || "Paris",
    rayon: "10",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/alertes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          filmTitre: form.filmTitre,
          ville: form.ville,
          rayon: Number(form.rayon),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez que le backend tourne.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 relative"
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-sm"
          style={{ background: "var(--bg-3)", color: "var(--text-3)", border: "none", cursor: "pointer" }}
        >
          ✕
        </button>

        {submitted ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>
              Alerte créée !
            </h2>
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              Vous serez notifié par email dès que <strong>{form.filmTitre}</strong> est programmé près de chez vous.
              Un email de confirmation vous a été envoyé.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 rounded-lg font-semibold text-white text-sm"
              style={{ background: "var(--red)", border: "none", cursor: "pointer" }}
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-extrabold mb-1" style={{ color: "var(--text)" }}>
              Créer une alerte
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-3)", lineHeight: 1.5 }}>
              Recevez un email dès que ce film est programmé près de chez vous.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-2)" }}>
                  Film recherché
                </label>
                <input
                  type="text"
                  value={form.filmTitre}
                  onChange={(e) => setForm({ ...form, filmTitre: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: "var(--bg-2)", border: "1.5px solid var(--border)", color: "var(--text)" }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-2)" }}>
                    Ville
                  </label>
                  <input
                    type="text"
                    value={form.ville}
                    onChange={(e) => setForm({ ...form, ville: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: "var(--bg-2)", border: "1.5px solid var(--border)", color: "var(--text)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-2)" }}>
                    Rayon (km)
                  </label>
                  <input
                    type="number"
                    value={form.rayon}
                    onChange={(e) => setForm({ ...form, rayon: e.target.value })}
                    min={1} max={50}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: "var(--bg-2)", border: "1.5px solid var(--border)", color: "var(--text)" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-2)" }}>
                  Adresse email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="vous@email.com"
                  required
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: "var(--bg-2)", border: "1.5px solid var(--border)", color: "var(--text)" }}
                />
              </div>

              {error && (
                <p className="text-sm px-3 py-2 rounded-lg" style={{ background: "#fee2e2", color: "#991b1b" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-bold text-white mt-1"
                style={{
                  background: loading ? "var(--text-3)" : "var(--red)",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                }}
              >
                {loading ? "Création en cours…" : "Créer l'alerte →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
