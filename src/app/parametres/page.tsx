"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";

// ─────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────

interface AuthUser {
  id: string;
  email: string;
  pseudo: string | null;
  nom: string | null;
  avatar?: string | null;
  emailVerified?: boolean;
  isPremium?: boolean;
  premiumUntil?: string | null;
}

// ─────────────────────────────────────────────────────────
//  Composant section réutilisable
// ─────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6 mb-4"
      style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
    >
      <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
        <span>{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function InputField({
  label, type = "text", value, onChange, placeholder, hint, disabled,
}: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; disabled?: boolean;
}) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-3)" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none disabled:opacity-50"
        style={{
          background: "var(--bg-3)",
          border: "1px solid var(--border)",
          color: "var(--text)",
        }}
      />
      {hint && <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{hint}</p>}
    </div>
  );
}

function SaveButton({ onClick, loading, label = "Enregistrer" }: { onClick: () => void; loading?: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity"
      style={{
        background: "var(--red)",
        opacity: loading ? 0.7 : 1,
        cursor: loading ? "not-allowed" : "pointer",
        border: "none",
      }}
    >
      {loading ? "…" : label}
    </button>
  );
}

function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div
      className="mt-3 px-4 py-2.5 rounded-xl text-sm font-medium"
      style={{
        background: type === "success" ? "rgba(34,197,94,0.12)" : "rgba(220,38,38,0.12)",
        color: type === "success" ? "#16a34a" : "#dc2626",
        border: `1px solid ${type === "success" ? "rgba(34,197,94,0.3)" : "rgba(220,38,38,0.3)"}`,
      }}
    >
      {type === "success" ? "✓ " : "✗ "}{msg}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Page Paramètres
// ─────────────────────────────────────────────────────────

export default function ParametresPage() {
  const router = useRouter();
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Pseudo ────────────────────────────────────────────
  const [pseudo, setPseudo]         = useState("");
  const [pseudoLoading, setPseudoLoading] = useState(false);
  const [pseudoMsg, setPseudoMsg]   = useState<{ text: string; type: "success" | "error" } | null>(null);

  // ── Mot de passe ──────────────────────────────────────
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd]         = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg]         = useState<{ text: string; type: "success" | "error" } | null>(null);

  // ── Email ─────────────────────────────────────────────
  const [newEmail, setNewEmail]     = useState("");
  const [emailPwd, setEmailPwd]     = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg]     = useState<{ text: string; type: "success" | "error" } | null>(null);

  // ── Suppression ───────────────────────────────────────
  const [deletePwd, setDeletePwd]     = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg]     = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ── Chargement du compte ──────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("cineradar_token");
    const email = localStorage.getItem("cineradar_email");
    const storedPseudo = localStorage.getItem("cineradar_pseudo");

    // Pas connecté du tout
    if (!token && !email) {
      setLoading(false);
      return;
    }

    // Charger depuis localStorage immédiatement (évite l'écran blanc)
    if (email) {
      setUser({ id: "", email, pseudo: storedPseudo ?? null, nom: null });
      setPseudo(storedPseudo ?? "");
    }

    // Essayer d'enrichir avec les données complètes depuis le JWT
    if (token) {
      authApi.me()
        .then((u) => {
          setUser(u);
          setPseudo(u.pseudo ?? storedPseudo ?? "");
        })
        .catch(() => {
          // Token invalide — on garde ce qu'on a depuis localStorage
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handler pseudo ────────────────────────────────────
  const handlePseudo = async () => {
    setPseudoMsg(null);
    if (!pseudo.trim()) return;
    const REGEX = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!REGEX.test(pseudo.trim())) {
      setPseudoMsg({ text: "3–20 caractères, lettres, chiffres, _ et -", type: "error" });
      return;
    }
    setPseudoLoading(true);
    try {
      const res = await authApi.updatePseudo(pseudo.trim());
      localStorage.setItem("cineradar_token", res.token);
      setUser((prev) => prev ? { ...prev, pseudo: res.pseudo } : null);
      setPseudoMsg({ text: "Pseudo mis à jour !", type: "success" });
    } catch (err: unknown) {
      setPseudoMsg({ text: err instanceof Error ? err.message : "Erreur", type: "error" });
    } finally {
      setPseudoLoading(false);
    }
  };

  // ── Handler mot de passe ──────────────────────────────
  const handlePassword = async () => {
    setPwdMsg(null);
    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdMsg({ text: "Tous les champs sont requis", type: "error" });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({ text: "Les mots de passe ne correspondent pas", type: "error" });
      return;
    }
    if (newPwd.length < 6) {
      setPwdMsg({ text: "Au moins 6 caractères requis", type: "error" });
      return;
    }
    setPwdLoading(true);
    try {
      await authApi.changePassword({ currentPassword: currentPwd, newPassword: newPwd });
      setPwdMsg({ text: "Mot de passe mis à jour avec succès !", type: "success" });
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (err: unknown) {
      setPwdMsg({ text: err instanceof Error ? err.message : "Erreur", type: "error" });
    } finally {
      setPwdLoading(false);
    }
  };

  // ── Handler email ─────────────────────────────────────
  const handleEmail = async () => {
    setEmailMsg(null);
    if (!newEmail.trim() || !emailPwd) {
      setEmailMsg({ text: "Tous les champs sont requis", type: "error" });
      return;
    }
    setEmailLoading(true);
    try {
      const res = await authApi.changeEmail({ newEmail: newEmail.trim(), password: emailPwd });
      localStorage.setItem("cineradar_token", res.token);
      localStorage.setItem("cineradar_email", res.email);
      setUser((prev) => prev ? { ...prev, email: res.email, emailVerified: false } : null);
      setEmailMsg({ text: res.message, type: "success" });
      setNewEmail(""); setEmailPwd("");
    } catch (err: unknown) {
      setEmailMsg({ text: err instanceof Error ? err.message : "Erreur", type: "error" });
    } finally {
      setEmailLoading(false);
    }
  };

  // ── Handler suppression ───────────────────────────────
  const handleDelete = async () => {
    setDeleteMsg(null);
    if (!deletePwd) {
      setDeleteMsg({ text: "Mot de passe requis", type: "error" });
      return;
    }
    setDeleteLoading(true);
    try {
      await authApi.deleteAccount(deletePwd);
      localStorage.removeItem("cineradar_token");
      localStorage.removeItem("cineradar_email");
      localStorage.removeItem("cineradar_avatar");
      localStorage.removeItem("cineradar_pseudo");
      router.replace("/");
    } catch (err: unknown) {
      setDeleteMsg({ text: err instanceof Error ? err.message : "Erreur", type: "error" });
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p style={{ color: "var(--text-3)" }}>Chargement…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>Vous devez être connecté</p>
        <Link href="/profil" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white no-underline" style={{ background: "var(--red)" }}>
          Se connecter →
        </Link>
      </div>
    );
  }

  const initiales = (user.pseudo ?? user.email).slice(0, 2).toUpperCase();

  return (
    <div className="px-6 py-10 mx-auto" style={{ maxWidth: 680 }}>

      {/* ── Retour ──────────────────────────────────────── */}
      <Link
        href="/profil"
        className="inline-flex items-center gap-1 text-sm mb-8 no-underline"
        style={{ color: "var(--text-3)" }}
      >
        ← Mon profil
      </Link>

      {/* ── En-tête ─────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden font-bold text-white text-lg shadow"
          style={{ background: "var(--red)" }}
        >
          {user.avatar
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            : initiales
          }
        </div>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
            Paramètres
          </h1>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            {user.email}
            {user.isPremium && (
              <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--red)", color: "white" }}>✦ Pro</span>
            )}
          </p>
        </div>
      </div>

      {/* ── Section pseudo ───────────────────────────────── */}
      <Section title="Identifiant" icon="👤">
        <p className="text-xs mb-4" style={{ color: "var(--text-3)" }}>
          Votre pseudo est votre identifiant public sur CinéRadar. Il apparaît sur votre profil et dans vos listes.
        </p>
        <InputField
          label="Pseudo"
          value={pseudo}
          onChange={setPseudo}
          placeholder="ex: cinephile42"
          hint="3 à 20 caractères — lettres, chiffres, _ et -"
        />
        <SaveButton onClick={handlePseudo} loading={pseudoLoading} />
        {pseudoMsg && <Toast msg={pseudoMsg.text} type={pseudoMsg.type} />}
      </Section>

      {/* ── Section sécurité — mot de passe ──────────────── */}
      <Section title="Mot de passe" icon="🔒">
        <p className="text-xs mb-4" style={{ color: "var(--text-3)" }}>
          Choisissez un mot de passe fort d&apos;au moins 6 caractères. Ne le partagez jamais.
        </p>
        <InputField
          label="Mot de passe actuel"
          type="password"
          value={currentPwd}
          onChange={setCurrentPwd}
          placeholder="••••••••"
        />
        <InputField
          label="Nouveau mot de passe"
          type="password"
          value={newPwd}
          onChange={setNewPwd}
          placeholder="••••••••"
          hint="Au moins 6 caractères"
        />
        <InputField
          label="Confirmer le nouveau mot de passe"
          type="password"
          value={confirmPwd}
          onChange={setConfirmPwd}
          placeholder="••••••••"
        />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <SaveButton onClick={handlePassword} loading={pwdLoading} label="Changer le mot de passe" />
          <a
            href="/auth/mot-de-passe-oublie"
            className="text-xs"
            style={{ color: "var(--text-3)", textDecoration: "underline" }}
          >
            Mot de passe oublié ?
          </a>
        </div>
        {pwdMsg && <Toast msg={pwdMsg.text} type={pwdMsg.type} />}
      </Section>

      {/* ── Section email ─────────────────────────────────── */}
      <Section title="Adresse e-mail" icon="✉️">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{user.email}</span>
          {user.emailVerified === false
            ? <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(234,179,8,0.15)", color: "#ca8a04" }}>Non vérifié</span>
            : <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(34,197,94,0.12)", color: "#16a34a" }}>Vérifié ✓</span>
          }
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--text-3)" }}>
          Après le changement, un email de confirmation sera envoyé à la nouvelle adresse. Votre mot de passe est requis pour confirmer.
        </p>
        <InputField
          label="Nouvelle adresse e-mail"
          type="email"
          value={newEmail}
          onChange={setNewEmail}
          placeholder="nouveau@email.fr"
        />
        <InputField
          label="Mot de passe (confirmation)"
          type="password"
          value={emailPwd}
          onChange={setEmailPwd}
          placeholder="••••••••"
        />
        <SaveButton onClick={handleEmail} loading={emailLoading} label="Changer l'adresse e-mail" />
        {emailMsg && <Toast msg={emailMsg.text} type={emailMsg.type} />}
      </Section>

      {/* ── Section abonnement ───────────────────────────── */}
      <Section title="Abonnement" icon="⭐">
        {user.isPremium ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="inline-flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-full"
                style={{ background: "var(--red)", color: "white" }}
              >
                ✦ Membre Pro actif
              </span>
            </div>
            {user.premiumUntil && (
              <p className="text-xs mb-4" style={{ color: "var(--text-3)" }}>
                Votre abonnement est actif jusqu&apos;au{" "}
                <strong style={{ color: "var(--text-2)" }}>
                  {new Date(user.premiumUntil).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </strong>.
              </p>
            )}
            <p className="text-xs mb-4" style={{ color: "var(--text-3)" }}>
              Profitez de toutes les fonctionnalités Pro : affiches personnalisées, statistiques avancées et accès prioritaire aux nouveautés.
            </p>
            <Link
              href="/premium"
              className="inline-flex items-center gap-1 text-sm font-semibold no-underline px-4 py-2 rounded-xl"
              style={{ background: "var(--bg-3)", color: "var(--text-2)", border: "1px solid var(--border)" }}
            >
              Gérer mon abonnement →
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-sm mb-4" style={{ color: "var(--text-2)" }}>
              Vous n&apos;avez pas encore d&apos;abonnement Pro. Passez Pro pour débloquer les affiches personnalisées et plus encore.
            </p>
            <Link
              href="/premium"
              className="inline-flex items-center gap-1 text-sm font-bold no-underline px-4 py-2 rounded-xl text-white"
              style={{ background: "var(--red)" }}
            >
              ✦ Découvrir le Pro →
            </Link>
          </div>
        )}
      </Section>

      {/* ── Section notifications ─────────────────────────── */}
      <Section title="Notifications" icon="🔔">
        <p className="text-xs mb-3" style={{ color: "var(--text-3)" }}>
          Gérez vos préférences de notifications directement depuis votre profil.
        </p>
        <div className="flex flex-col gap-3">
          {[
            { label: "Nouvelles séances pour mes alertes", active: true },
            { label: "Quelqu'un vous suit", active: true },
            { label: "Activité sur vos listes partagées", active: false },
            { label: "Newsletters CinéRadar", active: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="text-sm" style={{ color: "var(--text-2)" }}>{item.label}</span>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{
                  background: item.active ? "rgba(34,197,94,0.12)" : "var(--bg-3)",
                  color: item.active ? "#16a34a" : "var(--text-3)",
                  border: `1px solid ${item.active ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
                }}
              >
                {item.active ? "Actif" : "Désactivé"}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: "var(--text-3)" }}>
          La gestion fine des notifications sera disponible prochainement.
        </p>
      </Section>

      {/* ── Section confidentialité ───────────────────────── */}
      <Section title="Confidentialité" icon="🔐">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium mb-0.5" style={{ color: "var(--text)" }}>Profil public</p>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                Votre profil est visible par tous les membres de CinéRadar si vous avez un pseudo.
                Rendez-le privé depuis la page Mon profil pour masquer vos listes et films vus.
              </p>
            </div>
          </div>
          <Link
            href="/profil"
            className="inline-flex items-center gap-1 text-sm no-underline mt-1"
            style={{ color: "var(--red)" }}
          >
            Gérer la visibilité du profil →
          </Link>
        </div>
      </Section>

      {/* ── Gestion du compte ────────────────────────────── */}
      <Section title="Gestion du compte" icon="🗂️">
        <p className="text-xs mb-4" style={{ color: "var(--text-3)" }}>
          La suppression est définitive. Votre compte, vos listes, vos avis et tout votre historique seront effacés.
        </p>
        <button
          onClick={() => { setShowDeleteModal(true); setDeletePwd(""); setDeleteMsg(null); }}
          className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{
            background: "transparent",
            color: "#dc2626",
            border: "1px solid rgba(220,38,38,0.4)",
            cursor: "pointer",
          }}
        >
          Supprimer mon compte
        </button>
      </Section>

      {/* ── Modale de confirmation ────────────────────────── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowDeleteModal(false); setDeleteMsg(null); } }}
        >
          <div
            className="w-full rounded-2xl p-7 shadow-2xl"
            style={{ maxWidth: 440, background: "var(--bg-2)", border: "1px solid var(--border)" }}
          >
            <div className="text-3xl mb-3 text-center">⚠️</div>
            <h3 className="text-lg font-extrabold text-center mb-2" style={{ color: "var(--text)" }}>
              Supprimer votre compte ?
            </h3>
            <p className="text-sm text-center mb-5" style={{ color: "var(--text-3)" }}>
              Cette action est <strong style={{ color: "var(--text)" }}>irréversible</strong>. Toutes vos données — favoris, listes, avis, historique — seront définitivement supprimées.
            </p>

            <InputField
              label="Confirmez votre mot de passe"
              type="password"
              value={deletePwd}
              onChange={setDeletePwd}
              placeholder="••••••••"
            />

            {deleteMsg && <Toast msg={deleteMsg.text} type={deleteMsg.type} />}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowDeleteModal(false); setDeletePwd(""); setDeleteMsg(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "var(--bg-3)", color: "var(--text-2)", border: "1px solid var(--border)", cursor: "pointer" }}
              >
                Non, annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{
                  background: "#dc2626",
                  opacity: deleteLoading ? 0.7 : 1,
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                  border: "none",
                }}
              >
                {deleteLoading ? "Suppression…" : "Oui, supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
