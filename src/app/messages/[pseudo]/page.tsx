"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import { messagesApi, type MessageThread } from "@/lib/api";

export default function ThreadPage({ params }: { params: Promise<{ pseudo: string }> }) {
  const { pseudo } = use(params);
  const [thread, setThread] = useState<MessageThread | null>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const myId = typeof window !== "undefined" ? (() => {
    try {
      const token = localStorage.getItem("cineradar_token");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId ?? payload.sub ?? null;
    } catch { return null; }
  })() : null;

  const load = async () => {
    try {
      const data = await messagesApi.getThread(pseudo);
      setThread(data);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {
      setError("Connexion requise");
    }
  };

  useEffect(() => { load(); }, [pseudo]);

  // Polling toutes les 5 secondes
  useEffect(() => {
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [pseudo]);

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
    <div className="flex flex-col h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--bg-2)" }}>
        <Link href="/messages" className="text-sm no-underline" style={{ color: "var(--text-3)" }}>←</Link>
        {thread && (
          <>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white overflow-hidden flex-shrink-0" style={{ background: "var(--red)" }}>
              {thread.partner.avatar
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={thread.partner.avatar} alt={thread.partner.pseudo} className="w-full h-full object-cover" />
                : (thread.partner.nom ?? thread.partner.pseudo ?? "?").slice(0, 2).toUpperCase()
              }
            </div>
            <Link href={`/profils/${thread.partner.pseudo}`} className="no-underline">
              <p className="text-sm font-bold" style={{ color: "var(--text)" }}>@{thread.partner.pseudo}</p>
            </Link>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {error && <p className="text-center py-8" style={{ color: "var(--text-3)" }}>{error}</p>}
        {thread?.messages.map((msg) => {
          const isMe = msg.senderId === myId;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-xs px-4 py-2 rounded-2xl text-sm"
                style={{
                  background: isMe ? "var(--red)" : "var(--bg-2)",
                  color: isMe ? "white" : "var(--text)",
                  border: isMe ? "none" : "1px solid var(--border)",
                  borderBottomRightRadius: isMe ? 4 : undefined,
                  borderBottomLeftRadius: isMe ? undefined : 4,
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
      <form onSubmit={handleSend} className="flex gap-2 px-4 py-3 border-t" style={{ borderColor: "var(--border)", background: "var(--bg-2)" }}>
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écrire un message…"
          className="flex-1 px-4 py-2 rounded-full text-sm outline-none"
          style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text)" }}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!content.trim() || sending}
          className="px-4 py-2 rounded-full text-sm font-bold text-white"
          style={{ background: "var(--red)", border: "none", cursor: !content.trim() || sending ? "not-allowed" : "pointer", opacity: !content.trim() || sending ? 0.6 : 1 }}
        >
          {sending ? "…" : "→"}
        </button>
      </form>
    </div>
  );
}
