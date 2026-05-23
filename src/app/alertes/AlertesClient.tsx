"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

export default function AlertesClient() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("cineradar_token");
    if (!token) return;
    fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.isPremium) setIsPro(true);
      })
      .catch(() => {});
  }, []);
  const [form, setForm] = useState({
    filmTitre: "",
    email: "",
    ville: "Paris",
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
      if (!res.ok) { setError(data.error ?? "Une erreur est survenue."); return; }
      setSubmitted(true);
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-6 py-12 mx-auto" style={{ maxWidth: 700 }}>
      <h1 className="text-3xl font-extrabold mb-2" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
        Alertes de programmation
      </h1>
      <p className="text-sm mb-10" style={{ color: "var(--text-3)", lineHeight: 1.6 }}>
        Soyez notifié par email dès qu&apos;un film est programmé près de chez vous.
      </p>

      {/* Formulaire */}
      <div className="card p-8 mb-10" style={{ borderRadius: 14 }}>
        {submitted ? (
          <div className="text-center py-6">
            <p className="text-5xl mb-4">✅</p>
            <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>Alerte créée !</h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-3)" }}>
              Vous recevrez un email dès que <strong>{form.filmTitre}</strong> est programmé à {form.ville}.
            </p>
            <button
              onClick={() => { setSubmitted(false); setForm({ filmTitre: "", email: "", ville: "Paris", rayon: "10" }); }}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: "var(--red)", border: "none", cursor: "pointer" }}
            >
              Créer une nouvelle alerte
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-extrabold mb-6" style={{ color: "var(--text)" }}>
              Nouvelle alerte
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-2)" }}>
                  Film recherché *
                </label>
                <input
                  type="text"
                  value={form.filmTitre}
                  onChange={(e) => setForm({ ...form, filmTitre: e.target.value })}
                  placeholder="Ex : Nosferatu, The Substance…"
                  required
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: "var(--bg-2)", border: "1.5px solid var(--border)", color: "var(--text)" }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-2)" }}>
                    Ville *
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
                    min={1} max={100}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: "var(--bg-2)", border: "1.5px solid var(--border)", color: "var(--text)" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-2)" }}>
                  Adresse email *
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
                className="w-full py-3 rounded-lg font-bold text-white"
                style={{ background: loading ? "var(--text-3)" : "var(--red)", border: "none", cursor: loading ? "not-allowed" : "pointer" }}
              >
                {loading ? "Création en cours…" : "Créer l'alerte →"}
              </button>
            </form>
          </>
        )}
      </div>

      {/* FAQ */}
      <div className="flex flex-col gap-4">
        {[
          {
            q: "Comment supprimer une alerte ?",
            r: "Chaque email de notification contient un lien de désabonnement. Cliquez-le pour supprimer l'alerte instantanément.",
          },
          {
            q: "Quand recevrai-je une notification ?",
            r: "Le programme est mis à jour chaque matin. Vous recevrez un email le jour même où le film apparaît dans la programmation d'un cinéma de votre zone.",
          },
        ].map(({ q, r }) => (
          <div key={q} className="card p-5" style={{ borderRadius: 12 }}>
            <p className="font-semibold text-sm mb-1" style={{ color: "var(--text)" }}>{q}</p>
            <p className="text-sm" style={{ color: "var(--text-3)", lineHeight: 1.6 }}>{r}</p>
          </div>
        ))}

        {/* Réponse conditionnelle selon le statut Pro */}
        <div className="card p-5" style={{ borderRadius: 12 }}>
          <p className="font-semibold text-sm mb-1" style={{ color: "var(--text)" }}>
            Puis-je créer plusieurs alertes ?
          </p>
          {isPro ? (
            <p className="text-sm" style={{ color: "var(--text-3)", lineHeight: 1.6 }}>
              Oui, vous pouvez créer autant d&apos;alertes que vous voulez, pour différents films ou différentes villes.
            </p>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-3)", lineHeight: 1.6 }}>
              Les comptes gratuits sont limités à <strong style={{ color: "var(--text-2)" }}>3 alertes</strong>.{" "}
              Les membres{" "}
              <a href="/premium" className="font-semibold no-underline" style={{ color: "var(--red)" }}>Pro</a>{" "}
              peuvent créer autant d&apos;alertes qu&apos;ils souhaitent, pour différents films ou différentes villes.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
