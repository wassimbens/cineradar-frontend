"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { messagesApi, type MessageThread } from "@/lib/api";

function getMyId(): string | null {
  try {
    const token = localStorage.getItem("cineradar_token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId ?? payload.sub ?? null;
  } catch { return null; }
}

export default function ThreadPage() {
  const params = useParams();
  const pseudo = typeof params.pseudo === "string" ? params.pseudo : "";

  const [thread, setThread] = useState<MessageThread | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMyId(getMyId());
  }, []);

  const load = useCallback(async () => {
    if (!pseudo) return;
    try {
      const data = await messagesApi.getThread(pseudo);
      setThread(data);
      setError(null);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      const isAuth = msg.toLowerCase().includes("authentifi") || msg.includes("401") || msg.includes("Non auth");
      setError(isAuth ? "auth" : msg);
    }
  }, [pseudo]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      await messagesApi.send(pseudo, content.trim());
      setContent("");
      await load();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: "100dvh", background: "var(--bg)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>
        <Link href="/messages" className="text-lg no-underline leading-none" style={{ color: "var(--text-3)" }}>←</Link>
        {thread ? (
          <>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white overflow-hidden flex-shrink-0" style={{ background: "var(--red)" }}>
              {thread.partner.avatar
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={thread.partner.avatar} alt={thread.partner.pseudo} className="w-full h-full object-cover" />
                : (thread.partner.nom ?? thread.partner.pseudo ?? "?").slice(0, 2).toUpperCase()
              }
            </div>
            <Link href={`/profil/${thread.partner.pseudo}`} className="no-underline">
              <p className="text-sm font-bold" style={{ color: "var(--text)" }}>@{thread.partner.pseudo}</p>
            </Link>
          </>
        ) : (
          <p className="text-sm font-bold" style={{ color: "var(--text)" }}>@{pseudo}</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 min-h-0">
        {error && (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">{error === "auth" ? "🔒" : "⚠️"}</p>
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              {error === "auth" ? "Connexion requise pour accéder à la messagerie." : error}
            </p>
            {error === "auth"
              ? <Link href="/profil" className="text-sm mt-3 inline-block" style={{ color: "var(--red)" }}>Se connecter</Link>
              : <button onClick={load} className="text-sm mt-3 inline-block" style={{ color: "var(--red)", background: "none", border: "none", cursor: "pointer" }}>Réessayer</button>
            }
          </div>
        )}
        {!error && thread?.messages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">💬</p>
            <p className="text-sm" style={{ color: "var(--text-3)" }}>Commencez la conversation !</p>
          </div>
        )}
        {thread?.messages.map((msg) => {
          const isMe = msg.senderId === myId;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-xs sm:max-w-sm px-4 py-2.5 text-sm"
                style={{
                  background: isMe ? "var(--red)" : "var(--bg-2)",
                  color: isMe ? "white" : "var(--text)",
                  border: isMe ? "none" : "1px solid var(--border)",
                  borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  wordBreak: "break-word",
                }}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form onSubmit={handleSend} className="flex gap-2 px-4 py-3 flex-shrink-0" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écrire un message…"
          className="flex-1 px-4 py-2.5 rounded-full text-sm outline-none"
          style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text)" }}
          disabled={sending}
          autoFocus
        />
        <button
          type="submit"
          disabled={!content.trim() || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: content.trim() && !sending ? "var(--red)" : "var(--bg-3)",
            border: "none",
            cursor: !content.trim() || sending ? "not-allowed" : "pointer",
            transition: "background 0.15s",
          }}
        >
          {sending ? (
            <span style={{ color: "var(--text-3)", fontSize: "0.8rem" }}>…</span>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={content.trim() ? "white" : "var(--text-3)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
