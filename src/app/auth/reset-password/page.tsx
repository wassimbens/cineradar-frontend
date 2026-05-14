"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Lien invalide ou expiré. Refaites une demande de réinitialisation.");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMsg("Le mot de passe doit faire au moins 6 caractères.");
      setStatus("error");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur inconnue");
      setStatus("success");
      setTimeout(() => router.push("/profil"), 3000);
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-extrabold mb-3" style={{ color: "var(--text)" }}>
          Mot de passe mis à jour !
        </h1>
        <p className="mb-4" style={{ color: "var(--text-2)" }}>
          Vous allez être redirigé vers la page de connexion…
        </p>
        <Link href="/profil" style={{ color: "var(--red)", fontWeight: 600 }}>
          Se connecter maintenant
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <p className="text-2xl font-extrabold mb-1" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
          Ciné<span style={{ color: "var(--red)" }}>Radar</span>
        </p>
        <h1 className="text-xl font-bold mt-3" style={{ color: "var(--text)" }}>
          Nouveau mot de passe
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
      >
        {status === "error" && errorMsg && (
          <div
            className="rounded-lg p-3 text-sm"
            style={{ background: "#fee2e2", color: "#dc2626" }}
          >
            {errorMsg}
            {errorMsg.includes("expiré") && (
              <span>
                {" "}
                <Link href="/auth/mot-de-passe-oublie" style={{ fontWeight: 700, textDecoration: "underline" }}>
                  Nouvelle demande
                </Link>
              </span>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-2)" }}>
            Nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Au moins 6 caractères"
              required
              minLength={6}
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none pr-10"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: "var(--text-3)" }}
            >
              {showPwd ? "Cacher" : "Voir"}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-2)" }}>
            Confirmer le mot de passe
          </label>
          <input
            type={showPwd ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Répétez le mot de passe"
            required
            className="rounded-lg px-4 py-2.5 text-sm outline-none"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              borderColor: confirm && password && confirm !== password ? "#dc2626" : undefined,
            }}
          />
          {confirm && password && confirm !== password && (
            <p className="text-xs" style={{ color: "#dc2626" }}>Les mots de passe ne correspondent pas</p>
          )}
        </div>

        <button
          type="submit"
          disabled={status === "loading" || !token}
          className="w-full py-3 rounded-xl font-bold text-white text-sm mt-1"
          style={{
            background: status === "loading" ? "var(--text-3)" : "var(--red)",
            cursor: status === "loading" ? "not-allowed" : "pointer",
          }}
        >
          {status === "loading" ? "Mise à jour…" : "Enregistrer le nouveau mot de passe"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg)" }}
    >
      <Suspense fallback={<p style={{ color: "var(--text-2)" }}>Chargement…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
