"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { messagesApi, type MessageConversation } from "@/lib/api";

const PAPI = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<MessageConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<{ id: string; pseudo: string; nom: string | null; avatar: string | null }[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await messagesApi.getConversations();
      setConversations(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Recherche de nouvel interlocuteur
  useEffect(() => {
    if (!userSearch.trim()) { setUserResults([]); return; }
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const token = localStorage.getItem("cineradar_token");
        const res = await fetch(`${PAPI}/api/users/search?q=${encodeURIComponent(userSearch)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setUserResults(data ?? []);
      } catch { setUserResults([]); }
      finally { setSearchingUsers(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const filtered = filter.trim()
    ? conversations.filter(c => {
        const name = (c.partner.pseudo ?? c.partner.nom ?? "").toLowerCase();
        return name.includes(filter.toLowerCase());
      })
    : conversations;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto" style={{ maxWidth: 680 }}>

        {/* Header */}
        <div className="px-4 sm:px-6 pt-8 pb-4">
          <h1 className="text-2xl font-bold mb-0.5" style={{ color: "var(--text)" }}>Messages</h1>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            {!loading && conversations.length > 0
              ? `${conversations.length} conversation${conversations.length > 1 ? "s" : ""}`
              : ""}
          </p>
        </div>

        {/* Barre de filtre */}
        <div className="px-4 sm:px-6 mb-3">
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filtrer les conversations…"
            className="w-full px-4 py-2.5 rounded-xl outline-none"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text)", fontSize: "0.9rem" }}
          />
        </div>

        {/* Nouvelle conversation */}
        <div className="px-4 sm:px-6 mb-5">
          <div className="relative">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Nouvelle conversation — rechercher un utilisateur…"
                className="flex-1 bg-transparent outline-none"
                style={{ color: "var(--text)", fontSize: "0.9rem" }}
              />
              {userSearch && (
                <button onClick={() => { setUserSearch(""); setUserResults([]); }}
                  style={{ color: "var(--text-3)", background: "none", border: "none", cursor: "pointer" }}>✕</button>
              )}
            </div>

            {(userResults.length > 0 || searchingUsers) && (
              <div className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-20"
                style={{ background: "var(--bg-2)", border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.18)" }}>
                {searchingUsers && <div className="text-center py-3 text-sm" style={{ color: "var(--text-3)" }}>Recherche…</div>}
                {userResults.map(u => {
                  const name = u.pseudo ?? u.nom ?? "?";
                  return (
                    <Link key={u.id} href={`/messages/${encodeURIComponent(name)}`}
                      onClick={() => { setUserSearch(""); setUserResults([]); }}
                      className="flex items-center gap-3 px-4 py-3 no-underline"
                      style={{ borderBottom: "1px solid var(--border)", color: "var(--text)", display: "flex" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-3)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm text-white overflow-hidden" style={{ background: "var(--red)" }}>
                        {u.avatar
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={u.avatar} alt={name} className="w-full h-full object-cover" />
                          : name.slice(0, 2).toUpperCase()
                        }
                      </div>
                      <div>
                        <p className="text-sm font-semibold">@{name}</p>
                        {u.nom && <p className="text-xs" style={{ color: "var(--text-3)" }}>{u.nom}</p>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Liste conversations */}
        <div className="px-4 sm:px-6 flex flex-col gap-1.5 pb-12">
          {loading && [1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse" style={{ background: "var(--bg-2)" }}>
              <div className="w-12 h-12 rounded-full flex-shrink-0" style={{ background: "var(--bg-3)" }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded" style={{ background: "var(--bg-3)", width: "40%" }} />
                <div className="h-3 rounded" style={{ background: "var(--bg-3)", width: "65%" }} />
              </div>
            </div>
          ))}

          {!loading && error && (
            <div className="text-center py-16">
              <p className="text-sm mb-3" style={{ color: "var(--text-3)" }}>Impossible de charger les messages.</p>
              <button onClick={load} style={{ color: "var(--red)", background: "none", border: "none", cursor: "pointer" }}>Réessayer</button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3">
              <span style={{ fontSize: "3rem" }}>💬</span>
              <p className="font-semibold text-lg" style={{ color: "var(--text)" }}>
                {filter ? "Aucun résultat" : "Aucune conversation"}
              </p>
              <p className="text-sm text-center" style={{ color: "var(--text-3)" }}>
                {filter ? "Essayez un autre nom." : "Utilisez la recherche ci-dessus pour démarrer une conversation."}
              </p>
            </div>
          )}

          {filtered.map(conv => {
            const name = conv.partner.pseudo ?? conv.partner.nom ?? "?";
            const hasUnread = conv.unreadCount > 0;
            return (
              <Link
                key={conv.partner.id}
                href={`/messages/${encodeURIComponent(name)}`}
                className="flex items-center gap-3 px-3 py-3 rounded-xl no-underline"
                style={{ background: "var(--bg-2)", border: `1px solid ${hasUnread ? "rgba(220,38,38,0.4)" : "var(--border)"}` }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-3)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-2)")}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-base text-white overflow-hidden" style={{ background: "var(--red)" }}>
                  {conv.partner.avatar
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={conv.partner.avatar} alt={name} className="w-full h-full object-cover" />
                    : name.slice(0, 2).toUpperCase()
                  }
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm truncate" style={{ color: "var(--text)", fontWeight: hasUnread ? 700 : 600 }}>
                      @{name}
                    </p>
                    <span className="text-xs flex-shrink-0" style={{ color: hasUnread ? "var(--red)" : "var(--text-3)", fontWeight: hasUnread ? 600 : 400 }}>
                      {fmtTime(conv.lastMessage.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs truncate" style={{ color: hasUnread ? "var(--text-2)" : "var(--text-3)", fontWeight: hasUnread ? 500 : 400 }}>
                      {conv.lastMessage.fromMe && <span style={{ color: "var(--text-3)" }}>Vous : </span>}
                      {conv.lastMessage.content}
                    </p>
                    {hasUnread && (
                      <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white font-bold" style={{ background: "var(--red)", fontSize: "0.65rem" }}>
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
