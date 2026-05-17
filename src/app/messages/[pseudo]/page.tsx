"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { messagesApi, type MessageThread, type MessageItem } from "@/lib/api";

// ─────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────

function getMyId(): string | null {
  try {
    const token = localStorage.getItem("cineradar_token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId ?? payload.sub ?? null;
  } catch { return null; }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateSep(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

const EMOJI_PALETTE = ["❤️", "😂", "😮", "😢", "👍", "🔥", "👏", "😡"];

// ─────────────────────────────────────────────────────────
//  Composant bulle de message
// ─────────────────────────────────────────────────────────

interface BubbleProps {
  msg: MessageItem;
  isMe: boolean;
  sameAsPrev: boolean;
  sameAsNext: boolean;
  myId: string | null;
  partnerName: string;
  partnerAvatar: string | null;
  pickerFor: string | null;
  onPickerToggle: (id: string) => void;
  onReact: (msgId: string, emoji: string) => void;
  onReply: (msg: MessageItem) => void;
  onScrollTo: (msgId: string) => void;
  msgRef: (el: HTMLDivElement | null) => void;
}

function MessageBubble({
  msg, isMe, sameAsPrev, sameAsNext,
  myId, partnerName, partnerAvatar,
  pickerFor, onPickerToggle, onReact, onReply, onScrollTo, msgRef,
}: BubbleProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPickerOpen = pickerFor === msg.id;

  const startLongPress = () => {
    longPressTimer.current = setTimeout(() => onPickerToggle(msg.id), 480);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  // Border-radius adaptatif pour les groupes de messages
  const tl = isMe ? 18 : (sameAsPrev ? 5 : 18);
  const tr = isMe ? (sameAsPrev ? 5 : 18) : 18;
  const br = isMe ? (sameAsNext ? 5 : 4) : (sameAsNext ? 5 : 18);
  const bl = isMe ? 4 : (sameAsNext ? 5 : 4);

  return (
    <div
      ref={msgRef}
      className={`flex items-end gap-2 transition-colors duration-300 ${isMe ? "flex-row-reverse" : "flex-row"}`}
      style={{ marginBottom: sameAsNext ? 2 : 10 }}
    >
      {/* Avatar partenaire (visible seulement sur le dernier message du groupe) */}
      {!isMe && (
        <div
          className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-xs text-white"
          style={{ background: "var(--red)", visibility: sameAsNext ? "hidden" : "visible" }}
        >
          {partnerAvatar
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={partnerAvatar} alt="" className="w-full h-full object-cover" />
            : partnerName.slice(0, 1).toUpperCase()
          }
        </div>
      )}

      {/* Contenu bulle + réactions + picker */}
      <div className={`group relative flex flex-col max-w-[72%] sm:max-w-[58%] ${isMe ? "items-end" : "items-start"}`}>

        {/* Boutons action au survol (desktop uniquement) */}
        <div
          className={`absolute top-1 hidden sm:flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto ${isMe ? "right-full pr-2" : "left-full pl-2"}`}
        >
          <button
            onClick={e => { e.stopPropagation(); onPickerToggle(msg.id); }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-base"
            style={{ background: "var(--bg-3)", border: "1px solid var(--border)", cursor: "pointer" }}
            title="Réagir"
          >😊</button>
          <button
            onClick={e => { e.stopPropagation(); onReply(msg); }}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "var(--bg-3)", border: "1px solid var(--border)", cursor: "pointer" }}
            title="Répondre"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
            </svg>
          </button>
        </div>

        {/* Bulle principale */}
        <div
          className="relative select-none"
          style={{
            background: isMe ? "var(--red)" : "var(--bg-2)",
            color: isMe ? "white" : "var(--text)",
            borderRadius: `${tl}px ${tr}px ${br}px ${bl}px`,
            padding: "9px 13px",
            border: isMe ? "none" : "1px solid var(--border)",
            wordBreak: "break-word",
            fontSize: "0.9rem",
            lineHeight: 1.45,
            cursor: "default",
          }}
          onTouchStart={startLongPress}
          onTouchEnd={cancelLongPress}
          onTouchMove={cancelLongPress}
        >
          {/* Aperçu du message auquel on répond */}
          {msg.replyTo && (
            <button
              onClick={() => onScrollTo(msg.replyTo!.id)}
              className="block w-full text-left mb-2 px-2.5 py-1.5 rounded-lg"
              style={{
                background: isMe ? "rgba(0,0,0,0.18)" : "var(--bg-3)",
                borderLeft: `3px solid ${isMe ? "rgba(255,255,255,0.6)" : "var(--red)"}`,
                cursor: "pointer",
                border: `1px solid ${isMe ? "rgba(255,255,255,0.15)" : "var(--border)"}`,
                borderLeftWidth: 3,
              }}
            >
              <p className="text-xs font-semibold mb-0.5 truncate" style={{ color: isMe ? "rgba(255,255,255,0.85)" : "var(--red)" }}>
                {msg.replyTo.senderId === myId ? "Vous" : `@${partnerName}`}
              </p>
              <p className="text-xs truncate" style={{ color: isMe ? "rgba(255,255,255,0.65)" : "var(--text-3)" }}>
                {msg.replyTo.content}
              </p>
            </button>
          )}

          {/* Texte du message */}
          <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>

          {/* Heure + lu */}
          <span
            className="ml-2 inline-block align-bottom"
            style={{ fontSize: "0.65rem", opacity: 0.55, whiteSpace: "nowrap", lineHeight: 1 }}
          >
            {formatTime(msg.createdAt)}
            {isMe && (
              <span style={{ marginLeft: 2 }}>{msg.lu ? "✓✓" : "✓"}</span>
            )}
          </span>
        </div>

        {/* Réactions existantes */}
        {msg.reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
            {msg.reactions.map(r => (
              <button
                key={r.emoji}
                onClick={() => onReact(msg.id, r.emoji)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all"
                style={{
                  background: r.mine ? "rgba(220,38,38,0.12)" : "var(--bg-2)",
                  border: `1px solid ${r.mine ? "var(--red)" : "var(--border)"}`,
                  color: "var(--text)",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                {r.emoji}
                {r.count > 1 && <span style={{ fontSize: "0.7rem", color: "var(--text-3)", fontWeight: 600 }}>{r.count}</span>}
              </button>
            ))}
            <button
              onClick={e => { e.stopPropagation(); onPickerToggle(msg.id); }}
              className="px-2 py-0.5 rounded-full"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-3)", cursor: "pointer", fontSize: "0.75rem" }}
            >+</button>
          </div>
        )}

        {/* Sélecteur d'emoji (floating) */}
        {isPickerOpen && (
          <div
            className={`absolute z-30 flex items-center gap-0.5 p-1.5 rounded-2xl ${isMe ? "right-0" : "left-0"}`}
            style={{
              bottom: "calc(100% + 6px)",
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {EMOJI_PALETTE.map(emoji => {
              const active = msg.reactions.find(r => r.emoji === emoji)?.mine;
              return (
                <button
                  key={emoji}
                  onClick={() => onReact(msg.id, emoji)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-transform hover:scale-125"
                  style={{
                    background: active ? "rgba(220,38,38,0.15)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    transform: active ? "scale(1.15)" : undefined,
                  }}
                >{emoji}</button>
              );
            })}
            {/* Séparateur + bouton Répondre */}
            <div style={{ width: 1, height: 28, background: "var(--border)", margin: "0 2px" }} />
            <button
              onClick={() => onReply(msg)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-110"
              style={{ background: "transparent", border: "none", cursor: "pointer" }}
              title="Répondre"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Page principale
// ─────────────────────────────────────────────────────────

export default function ThreadPage() {
  const params = useParams();
  const pseudo = typeof params.pseudo === "string" ? params.pseudo : "";

  const [thread, setThread] = useState<MessageThread | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<MessageItem | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  // Hauteur dynamique pour compenser le clavier mobile (visualViewport)
  const [containerH, setContainerH] = useState<string>("100dvh");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const messagesAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMyId(getMyId()); }, []);

  // ── Gestion du clavier mobile via visualViewport ──────
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      // La hauteur visible réelle (excluant le clavier)
      setContainerH(`${vv.height}px`);
      // Scroll to bottom quand le clavier apparaît
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "instant" });
      });
    };

    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  const load = useCallback(async (scrollToBottom = false) => {
    if (!pseudo) return;
    try {
      const data = await messagesApi.getThread(pseudo);
      setThread(data);
      setError(null);
      if (scrollToBottom) {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      const isAuth = msg.toLowerCase().includes("authentifi") || msg.includes("401");
      setError(isAuth ? "auth" : msg);
    }
  }, [pseudo]);

  useEffect(() => { load(true); }, [load]);
  useEffect(() => {
    const id = setInterval(() => load(false), 5000);
    return () => clearInterval(id);
  }, [load]);

  // Ferme le picker en cliquant en dehors
  useEffect(() => {
    if (!pickerFor) return;
    const close = () => setPickerFor(null);
    document.addEventListener("click", close, true);
    return () => document.removeEventListener("click", close, true);
  }, [pickerFor]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      await messagesApi.send(pseudo, content.trim(), replyTo?.id);
      setContent("");
      setReplyTo(null);
      await load(true);
    } finally {
      setSending(false);
    }
  };

  const handleReact = useCallback(async (messageId: string, emoji: string) => {
    setPickerFor(null);
    setThread(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: prev.messages.map(msg => {
          if (msg.id !== messageId) return msg;
          const existing = msg.reactions.find(r => r.emoji === emoji);
          if (!existing) {
            return { ...msg, reactions: [...msg.reactions, { emoji, count: 1, mine: true }] };
          }
          if (existing.mine) {
            const newCount = existing.count - 1;
            return {
              ...msg,
              reactions: newCount === 0
                ? msg.reactions.filter(r => r.emoji !== emoji)
                : msg.reactions.map(r => r.emoji === emoji ? { ...r, count: newCount, mine: false } : r),
            };
          }
          return { ...msg, reactions: msg.reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, mine: true } : r) };
        }),
      };
    });
    await messagesApi.react(messageId, emoji).catch(() => load(false));
  }, [load]);

  const handleReply = useCallback((msg: MessageItem) => {
    setReplyTo(msg);
    setPickerFor(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const scrollToMessage = useCallback((msgId: string) => {
    const el = msgRefs.current[msgId];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.style.outline = "2px solid var(--red)";
    el.style.borderRadius = "12px";
    setTimeout(() => { if (el) { el.style.outline = ""; el.style.borderRadius = ""; } }, 1000);
  }, []);

  // Grouper les messages par jour
  const grouped = useMemo(() => {
    if (!thread) return [];
    const days: { dateStr: string; label: string; msgs: MessageItem[] }[] = [];
    for (const msg of thread.messages) {
      const d = new Date(msg.createdAt).toDateString();
      const last = days[days.length - 1];
      if (last && last.dateStr === d) { last.msgs.push(msg); }
      else days.push({ dateStr: d, label: formatDateSep(msg.createdAt), msgs: [msg] });
    }
    return days;
  }, [thread]);

  const partnerName = thread?.partner.pseudo ?? pseudo;
  const partnerAvatar = thread?.partner.avatar ?? null;

  if (error === "auth") return (
    <div className="flex flex-col items-center justify-center gap-3" style={{ height: containerH, background: "var(--bg)" }}>
      <span className="text-4xl">🔒</span>
      <p className="text-sm" style={{ color: "var(--text-3)" }}>Connexion requise pour accéder à la messagerie.</p>
      <Link href="/profil" className="text-sm font-semibold" style={{ color: "var(--red)" }}>Se connecter</Link>
    </div>
  );

  return (
    // Wrapper centré pour le web — sur mobile il prend toute la largeur
    <div style={{ background: "var(--bg)", minHeight: containerH, display: "flex", justifyContent: "center" }}>
      <div
        className="flex flex-col w-full"
        style={{
          height: containerH,
          maxWidth: 760,
          background: "var(--bg)",
        }}
      >

        {/* ── Header ─────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-3 sm:px-4 h-14 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}
        >
          <Link
            href={`/profil/${partnerName}`}
            className="p-1.5 rounded-lg flex-shrink-0 no-underline"
            style={{ color: "var(--text-3)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </Link>

          <Link href={`/profil/${partnerName}`} className="flex items-center gap-2.5 flex-1 min-w-0 no-underline">
            <div
              className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm text-white overflow-hidden"
              style={{ background: "var(--red)" }}
            >
              {partnerAvatar
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={partnerAvatar} alt={partnerName} className="w-full h-full object-cover" />
                : partnerName.slice(0, 2).toUpperCase()
              }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>@{partnerName}</p>
              {thread?.partner.nom && (
                <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>{thread.partner.nom}</p>
              )}
            </div>
          </Link>
        </div>

        {/* ── Zone messages ───────────────────────────────── */}
        <div
          ref={messagesAreaRef}
          className="flex-1 overflow-y-auto px-3 sm:px-4 pt-4 pb-2 min-h-0"
        >

          {/* Erreur non-auth */}
          {error && error !== "auth" && (
            <div className="text-center py-10">
              <p className="text-sm mb-3" style={{ color: "var(--text-3)" }}>{error}</p>
              <button onClick={() => load(true)} style={{ color: "var(--red)", background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem" }}>
                Réessayer
              </button>
            </div>
          )}

          {/* Skeleton chargement */}
          {!error && !thread && (
            <div className="flex flex-col gap-3 pt-2">
              {[60, 40, 75, 50].map((w, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                  <div className="h-9 rounded-2xl animate-pulse" style={{ width: `${w}%`, background: "var(--bg-2)" }} />
                </div>
              ))}
            </div>
          )}

          {/* État vide */}
          {!error && thread?.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full pb-10">
              <div
                className="w-20 h-20 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-2xl text-white overflow-hidden mb-4"
                style={{ background: "var(--red)" }}
              >
                {partnerAvatar
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={partnerAvatar} alt={partnerName} className="w-full h-full object-cover" />
                  : partnerName.slice(0, 2).toUpperCase()
                }
              </div>
              <p className="font-bold mb-1" style={{ color: "var(--text)" }}>@{partnerName}</p>
              <p className="text-sm" style={{ color: "var(--text-3)" }}>Commencez la conversation 👋</p>
            </div>
          )}

          {/* Messages groupés par jour */}
          {grouped.map(({ dateStr, label, msgs }) => (
            <div key={dateStr}>
              {/* Séparateur de date */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                <span className="text-xs px-3 py-1 rounded-full flex-shrink-0" style={{ color: "var(--text-3)", background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                  {label}
                </span>
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              </div>

              {msgs.map((msg, idx) => {
                const isMe = msg.senderId === myId;
                const sameAsPrev = msgs[idx - 1]?.senderId === msg.senderId;
                const sameAsNext = msgs[idx + 1]?.senderId === msg.senderId;
                return (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    isMe={isMe}
                    sameAsPrev={sameAsPrev}
                    sameAsNext={sameAsNext}
                    myId={myId}
                    partnerName={partnerName}
                    partnerAvatar={partnerAvatar}
                    pickerFor={pickerFor}
                    onPickerToggle={id => setPickerFor(p => p === id ? null : id)}
                    onReact={handleReact}
                    onReply={handleReply}
                    onScrollTo={scrollToMessage}
                    msgRef={el => { msgRefs.current[msg.id] = el; }}
                  />
                );
              })}
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* ── Barre de réponse ────────────────────────────── */}
        {replyTo && (
          <div
            className="flex items-center gap-3 px-4 py-2 flex-shrink-0"
            style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}
          >
            <div className="flex-1 min-w-0 pl-3" style={{ borderLeft: "3px solid var(--red)" }}>
              <p className="text-xs font-semibold" style={{ color: "var(--red)" }}>
                ↩ {replyTo.senderId === myId ? "Vous" : `@${partnerName}`}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>{replyTo.content}</p>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs"
              style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text-3)", cursor: "pointer" }}
            >✕</button>
          </div>
        )}

        {/* ── Composer ────────────────────────────────────── */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 px-3 sm:px-4 py-3 flex-shrink-0"
          style={{ borderTop: replyTo ? "none" : "1px solid var(--border)", background: "var(--bg-2)" }}
        >
          <input
            ref={inputRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
            onFocus={() => {
              // Scroll to bottom quand le clavier s'ouvre (délai pour attendre l'animation)
              setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 320);
            }}
            placeholder="Message…"
            className="flex-1 px-4 py-2.5 rounded-full outline-none"
            style={{
              background: "var(--bg-3)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              minWidth: 0,
              fontSize: "1rem", // 16px — évite le zoom iOS sur les inputs < 16px
            }}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!content.trim() || sending}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
            style={{
              background: content.trim() && !sending ? "var(--red)" : "var(--bg-3)",
              border: "none",
              cursor: !content.trim() || sending ? "not-allowed" : "pointer",
            }}
          >
            {sending
              ? <span style={{ color: "var(--text-3)", fontSize: "0.75rem" }}>…</span>
              : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={content.trim() ? "white" : "var(--text-3)"}
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )
            }
          </button>
        </form>
      </div>
    </div>
  );
}
