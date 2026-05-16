"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { messagesApi, type MessageConversation } from "@/lib/api";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<MessageConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    messagesApi.getConversations()
      .then(setConversations)
      .catch(() => setError("Connexion requise"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 py-8 mx-auto" style={{ maxWidth: 640 }}>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/profil" className="text-sm no-underline" style={{ color: "var(--text-3)" }}>← Profil</Link>
        <h1 className="text-xl font-extrabold" style={{ color: "var(--text)" }}>Messages</h1>
      </div>

      {loading && <p style={{ color: "var(--text-3)" }}>Chargement…</p>}
      {error && <p style={{ color: "var(--text-3)" }}>{error} — <Link href="/profil">Se connecter</Link></p>}

      {!loading && !error && conversations.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">✉️</p>
          <p className="font-bold mb-1" style={{ color: "var(--text)" }}>Aucune conversation</p>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>Rendez-vous sur le profil d&apos;un utilisateur pour envoyer un message.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {conversations.map(({ partner, lastMessage, unreadCount }) => (
          <Link
            key={partner.id}
            href={`/messages/${partner.pseudo}`}
            className="flex items-center gap-3 p-4 rounded-xl no-underline transition-colors"
            style={{ background: "var(--bg-2)", border: `1px solid ${unreadCount > 0 ? "var(--red)" : "var(--border)"}` }}
          >
            <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm text-white overflow-hidden" style={{ background: "var(--red)" }}>
              {partner.avatar
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={partner.avatar} alt={partner.pseudo} className="w-full h-full object-cover" />
                : (partner.nom ?? partner.pseudo ?? "?").slice(0, 2).toUpperCase()
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold" style={{ color: "var(--text)" }}>@{partner.pseudo}</p>
                <p className="text-xs flex-shrink-0" style={{ color: "var(--text-3)" }}>{timeAgo(lastMessage.createdAt)}</p>
              </div>
              <p className="text-xs truncate mt-0.5" style={{ color: unreadCount > 0 ? "var(--text)" : "var(--text-3)", fontWeight: unreadCount > 0 ? 600 : 400 }}>
                {lastMessage.fromMe ? "Vous : " : ""}{lastMessage.content}
              </p>
            </div>
            {unreadCount > 0 && (
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "var(--red)" }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
