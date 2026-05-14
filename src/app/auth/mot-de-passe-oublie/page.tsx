"use client";

import { useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
      setErrorMsg("Une erreur est survenue. Réessayez.");
    }
  }

  if (status === "sent") {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "var(--bg)" }}
      >
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-extrabold mb-3" style={{ color: "var(--text)" }}>
            Email envoyé !
          </h1>
          <p className="mb-6 leading-relaxed" style={{ color: "var(--text-2)" }}>
            Si un compte existe pour <strong>{email}</strong>, vous recevrez un lien de
            réinitialisation valable <strong>1 heure</strong>.
          </p>
          <Link href="/profil" style={{ color: "var(--red)", fontWeight: 600 }}>
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg)" }}
    >
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-2xl font-extrabold mb-1" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
            Ciné<span style={{ color: "var(--red)" }}>Radar</span>
          </p>
          <h1 className="text-xl font-bold mt-3" style={{ color: "var(--text)" }}>
            Mot de passe oublié
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 flex flex-col gap-4"
          style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
        >
          {status === "error" && (
            <div
              className="rounded-lg p-3 text-sm"
              style={{ background: "#fee2e2", color: "#dc2626" }}
            >
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-2)" }}>
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              className="rounded-lg px-4 py-2.5 text-sm outline-none"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-3 rounded-xl font-bold text-white text-sm"
            style={{
              background: status === "loading" ? "var(--text-3)" : "var(--red)",
              cursor: status === "loading" ? "not-allowed" : "pointer",
            }}
          >
            {status === "loading" ? "Envoi en cours…" : "Envoyer le lien de réinitialisation"}
          </button>
        </form>

        <p className="text-center text-sm mt-4" style={{ color: "var(--text-2)" }}>
          Vous vous souvenez de votre mot de passe ?{" "}
          <Link href="/profil" style={{ color: "var(--red)", fontWeight: 600 }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
