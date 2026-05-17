"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { messagesApi, profilApi, type MessageThread, type MessageItem, type MessageFilmPreview } from "@/lib/api";

// ─────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────

const PAPI = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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
//  Film Card (message film partagé)
// ─────────────────────────────────────────────────────────

function FilmCard({ film, isMe }: { film: MessageFilmPreview; isMe: boolean }) {
  const note = film.imdbNote ?? film.tmdbNote;
  return (
    <Link
      href={`/films/${film.id}`}
      className="flex gap-3 rounded-xl overflow-hidden no-underline mt-1"
      style={{
        background: isMe ? "rgba(0,0,0,0.2)" : "var(--bg-3)",
        border: `1px solid ${isMe ? "rgba(255,255,255,0.1)" : "var(--border)"}`,
        maxWidth: 240,
      }}
    >
      {film.affiche ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://image.tmdb.org/t/p/w92${film.affiche}`}
          alt={film.titre}
          className="w-14 object-cover flex-shrink-0"
          style={{ minHeight: 80 }}
        />
      ) : (
        <div className="w-14 flex-shrink-0 flex items-center justify-center" style={{ background: "var(--bg-2)", minHeight: 80 }}>
          <span style={{ fontSize: "1.5rem" }}>🎬</span>
        </div>
      )}
      <div className="flex flex-col justify-center py-2 pr-2 min-w-0">
        <p className="text-xs font-bold truncate" style={{ color: isMe ? "white" : "var(--text)" }}>{film.titre}</p>
        {film.annee && <p className="text-xs" style={{ color: isMe ? "rgba(255,255,255,0.6)" : "var(--text-3)" }}>{film.annee}</p>}
        {note && (
          <p className="text-xs font-semibold mt-0.5" style={{ color: isMe ? "rgba(255,255,255,0.8)" : "var(--red)" }}>
            ★ {note.toFixed(1)}
          </p>
        )}
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────
//  Film Search pour le partage
// ─────────────────────────────────────────────────────────

function FilmSearch({
  onSelect,
  onClose,
}: {
  onSelect: (film: MessageFilmPreview) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<MessageFilmPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("cineradar_token");
        const res = await fetch(`${PAPI}/api/films?q=${encodeURIComponent(q)}&limit=6`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setResults((data.films ?? data) as MessageFilmPreview[]);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [q]);

  return (
    <div
      className="flex-shrink-0 border-t"
      style={{ background: "var(--bg-2)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <span style={{ color: "var(--text-3)", fontSize: "1rem" }}>🎬</span>
        <input
          ref={inputRef}
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Rechercher un film à partager…"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: "var(--text)", fontSize: "1rem" }}
        />
        <button
          onClick={onClose}
          className="text-xs px-2 py-1 rounded"
          style={{ color: "var(--text-3)", background: "var(--bg-3)", border: "1px solid var(--border)", cursor: "pointer" }}
        >✕</button>
      </div>

      {(results.length > 0 || loading) && (
        <div className="border-t" style={{ borderColor: "var(--border)", maxHeight: 220, overflowY: "auto" }}>
          {loading && (
            <div className="text-center py-3 text-sm" style={{ color: "var(--text-3)" }}>Recherche…</div>
          )}
          {results.map(film => (
            <button
              key={film.id}
              onClick={() => onSelect(film)}
              className="flex items-center gap-3 w-full px-3 py-2 text-left transition-colors"
              style={{ background: "transparent", border: "none", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-3)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {film.affiche ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://image.tmdb.org/t/p/w45${film.affiche}`}
                  alt={film.titre}
                  className="w-8 h-11 object-cover rounded flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-11 rounded flex-shrink-0 flex items-center justify-center" style={{ background: "var(--bg-3)" }}>
                  🎬
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{film.titre}</p>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>{film.annee ?? ""}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Floating action panel (émojis + actions)
// ─────────────────────────────────────────────────────────

interface ActionPanelProps {
  msg: MessageItem;
  isMe: boolean;
  myId: string | null;
  partnerName: string;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  onClose: () => void;
}

function ActionPanel({ msg, isMe, onReact, onReply, onEdit, onDelete, onPin, onClose }: ActionPanelProps) {
  return (
    <div
      className={`absolute z-40 flex flex-col rounded-2xl overflow-hidden ${isMe ? "right-0" : "left-0"}`}
      style={{
        bottom: "calc(100% + 8px)",
        background: "var(--bg-2)",
        border: "1px solid var(--border)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        minWidth: 0,
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Ligne 1 : palette emoji */}
      <div className="flex items-center gap-0.5 px-1.5 py-1.5">
        {EMOJI_PALETTE.map(emoji => {
          const active = msg.reactions.find(r => r.emoji === emoji)?.mine;
          return (
            <button
              key={emoji}
              onPointerDown={e => { e.stopPropagation(); e.preventDefault(); onReact(emoji); onClose(); }}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-transform hover:scale-125 active:scale-110"
              style={{
                background: active ? "rgba(220,38,38,0.15)" : "transparent",
                border: "none",
                cursor: "pointer",
                transform: active ? "scale(1.15)" : undefined,
              }}
            >{emoji}</button>
          );
        })}
      </div>

      {/* Séparateur */}
      <div style={{ height: 1, background: "var(--border)", margin: "0 8px" }} />

      {/* Ligne 2 : actions */}
      <div className="flex items-center gap-0 px-1 py-1">
        <ActionBtn icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
          </svg>
        } label="Répondre" onClick={() => { onReply(); onClose(); }} />

        {msg.pinned ? (
          <ActionBtn icon="📌" label="Désépingler" onClick={() => { onPin(); onClose(); }} />
        ) : (
          <ActionBtn icon="📌" label="Épingler" onClick={() => { onPin(); onClose(); }} />
        )}

        {isMe && !msg.deleted && (
          <ActionBtn icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          } label="Modifier" onClick={() => { onEdit(); onClose(); }} />
        )}

        {isMe && !msg.deleted && (
          <ActionBtn icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          } label="Supprimer" labelColor="var(--red)" onClick={() => { onDelete(); onClose(); }} />
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  labelColor,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  labelColor?: string;
  onClick: () => void;
}) {
  return (
    <button
      onPointerDown={e => { e.stopPropagation(); e.preventDefault(); onClick(); }}
      className="flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl transition-colors"
      style={{ background: "transparent", border: "none", cursor: "pointer", color: labelColor ?? "var(--text-3)", minWidth: 44 }}
      onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-3)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <span className="flex items-center justify-center" style={{ width: 16, height: 16, fontSize: typeof icon === "string" ? "0.9rem" : undefined }}>
        {icon}
      </span>
      <span style={{ fontSize: "0.6rem", whiteSpace: "nowrap" }}>{label}</span>
    </button>
  );
}

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
  editingId: string | null;
  onPickerToggle: (id: string) => void;
  onPickerClose: () => void;
  onReact: (msgId: string, emoji: string) => void;
  onReply: (msg: MessageItem) => void;
  onEdit: (msg: MessageItem) => void;
  onDelete: (msgId: string) => void;
  onPin: (msgId: string) => void;
  onScrollTo: (msgId: string) => void;
  msgRef: (el: HTMLDivElement | null) => void;
}

function MessageBubble({
  msg, isMe, sameAsPrev, sameAsNext,
  myId, partnerName, partnerAvatar,
  pickerFor, editingId,
  onPickerToggle, onPickerClose,
  onReact, onReply, onEdit, onDelete, onPin, onScrollTo, msgRef,
}: BubbleProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPanelOpen = pickerFor === msg.id;
  const isEditing = editingId === msg.id;

  const startLongPress = (e: React.TouchEvent) => {
    if (msg.deleted) return;
    e.preventDefault(); // évite la sélection de texte
    longPressTimer.current = setTimeout(() => onPickerToggle(msg.id), 480);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  const tl = isMe ? 18 : (sameAsPrev ? 5 : 18);
  const tr = isMe ? (sameAsPrev ? 5 : 18) : 18;
  const br = isMe ? (sameAsNext ? 5 : 4) : (sameAsNext ? 5 : 18);
  const bl = isMe ? 4 : (sameAsNext ? 5 : 4);

  return (
    <div
      ref={msgRef}
      className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
      style={{ marginBottom: sameAsNext ? 2 : 10 }}
    >
      {/* Avatar partenaire */}
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

      {/* Groupe bulle + réactions + panel */}
      <div className={`group relative flex flex-col max-w-[72%] sm:max-w-[58%] ${isMe ? "items-end" : "items-start"}`}>

        {/* Boutons hover desktop */}
        {!msg.deleted && !isEditing && (
          <div
            className={`absolute top-1 hidden sm:flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto ${isMe ? "right-full pr-2" : "left-full pl-2"}`}
          >
            <button
              onClick={e => { e.stopPropagation(); onPickerToggle(msg.id); }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
              style={{ background: "var(--bg-3)", border: "1px solid var(--border)", cursor: "pointer" }}
              title="Réactions & actions"
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
        )}

        {/* Bulle principale */}
        <div
          className="relative"
          style={{
            background: msg.deleted
              ? "var(--bg-2)"
              : isMe ? "var(--red)" : "var(--bg-2)",
            color: msg.deleted
              ? "var(--text-3)"
              : isMe ? "white" : "var(--text)",
            borderRadius: `${tl}px ${tr}px ${br}px ${bl}px`,
            padding: "9px 13px",
            border: isMe && !msg.deleted ? "none" : "1px solid var(--border)",
            wordBreak: "break-word",
            fontSize: "0.9rem",
            lineHeight: 1.45,
            cursor: "default",
            fontStyle: msg.deleted ? "italic" : "normal",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
          onTouchStart={startLongPress}
          onTouchEnd={cancelLongPress}
          onTouchMove={cancelLongPress}
        >
          {/* Reply preview */}
          {msg.replyTo && !msg.deleted && (
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

          {/* Film partagé */}
          {msg.film && !msg.deleted && (
            <FilmCard film={msg.film} isMe={isMe} />
          )}

          {/* Texte */}
          {msg.content && (
            <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
          )}

          {/* Heure + modifié + lu */}
          {!msg.deleted && (
            <span
              className="ml-2 inline-block align-bottom"
              style={{ fontSize: "0.65rem", opacity: 0.55, whiteSpace: "nowrap", lineHeight: 1 }}
            >
              {msg.edited && <span style={{ marginRight: 3 }}>modifié ·</span>}
              {formatTime(msg.createdAt)}
              {isMe && <span style={{ marginLeft: 2 }}>{msg.lu ? "✓✓" : "✓"}</span>}
            </span>
          )}
          {msg.deleted && (
            <span style={{ fontSize: "0.75rem" }}>Message supprimé</span>
          )}
        </div>

        {/* Réactions */}
        {!msg.deleted && msg.reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
            {msg.reactions.map(r => (
              <button
                key={r.emoji}
                onPointerDown={e => { e.stopPropagation(); e.preventDefault(); onReact(msg.id, r.emoji); }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
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
              onPointerDown={e => { e.stopPropagation(); e.preventDefault(); onPickerToggle(msg.id); }}
              className="px-2 py-0.5 rounded-full"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-3)", cursor: "pointer", fontSize: "0.75rem" }}
            >+</button>
          </div>
        )}

        {/* Panel flottant (émojis + actions) */}
        {isPanelOpen && (
          <ActionPanel
            msg={msg}
            isMe={isMe}
            myId={myId}
            partnerName={partnerName}
            onReact={emoji => onReact(msg.id, emoji)}
            onReply={() => onReply(msg)}
            onEdit={() => onEdit(msg)}
            onDelete={() => onDelete(msg.id)}
            onPin={() => onPin(msg.id)}
            onClose={onPickerClose}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Inline edit input
// ─────────────────────────────────────────────────────────

function InlineEdit({
  initialContent,
  isMe,
  onSave,
  onCancel,
}: {
  initialContent: string;
  isMe: boolean;
  onSave: (content: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialContent);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.selectionStart = el.selectionEnd = el.value.length;
  }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSave(value.trim()); }
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className={`flex flex-col gap-1 max-w-[72%] sm:max-w-[58%] ${isMe ? "items-end self-end ml-auto" : "items-start"}`}>
      <textarea
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKey}
        rows={Math.min(5, Math.max(1, value.split("\n").length))}
        className="w-full rounded-2xl px-3 py-2 text-sm outline-none resize-none"
        style={{
          background: isMe ? "var(--red)" : "var(--bg-2)",
          color: isMe ? "white" : "var(--text)",
          border: `2px solid ${isMe ? "rgba(255,255,255,0.5)" : "var(--red)"}`,
          fontSize: "0.9rem",
          lineHeight: 1.45,
          minWidth: 180,
        }}
      />
      <div className="flex gap-2">
        <button
          onClick={() => onSave(value.trim())}
          className="text-xs px-3 py-1 rounded-lg font-semibold"
          style={{ background: "var(--red)", color: "white", border: "none", cursor: "pointer" }}
        >Enregistrer</button>
        <button
          onClick={onCancel}
          className="text-xs px-3 py-1 rounded-lg"
          style={{ background: "var(--bg-3)", color: "var(--text-3)", border: "1px solid var(--border)", cursor: "pointer" }}
        >Annuler</button>
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [shareFilm, setShareFilm] = useState<MessageFilmPreview | null>(null);
  const [showFilmSearch, setShowFilmSearch] = useState(false);
  const [containerH, setContainerH] = useState<string>("100dvh");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => { setMyId(getMyId()); }, []);

  // Hauteur dynamique (clavier mobile)
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      setContainerH(`${vv.height}px`);
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "instant" }));
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

  // Ferme le panel en cliquant en dehors (bubble phase — permet stopPropagation)
  useEffect(() => {
    if (!pickerFor) return;
    const close = () => setPickerFor(null);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [pickerFor]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && !shareFilm) || sending) return;
    setSending(true);
    try {
      await messagesApi.send(pseudo, content.trim(), replyTo?.id, shareFilm?.id);
      setContent("");
      setReplyTo(null);
      setShareFilm(null);
      setShowFilmSearch(false);
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

  const handleEdit = useCallback((msg: MessageItem) => {
    setEditingId(msg.id);
    setPickerFor(null);
  }, []);

  const handleEditSave = useCallback(async (msgId: string, newContent: string) => {
    if (!newContent) return;
    setEditingId(null);
    setThread(prev => prev ? {
      ...prev,
      messages: prev.messages.map(m => m.id === msgId ? { ...m, content: newContent, edited: true } : m),
    } : prev);
    await messagesApi.editMessage(msgId, newContent).catch(() => load(false));
  }, [load]);

  const handleDelete = useCallback(async (msgId: string) => {
    setThread(prev => prev ? {
      ...prev,
      messages: prev.messages.map(m => m.id === msgId ? { ...m, deleted: true, content: "", reactions: [] } : m),
      pinned: prev.pinned?.id === msgId ? null : prev.pinned,
    } : prev);
    await messagesApi.deleteMessage(msgId).catch(() => load(false));
  }, [load]);

  const handlePin = useCallback(async (msgId: string) => {
    const { pinned: newPinned } = await messagesApi.pinMessage(pseudo, msgId).catch(() => ({ pinned: false }));
    setThread(prev => {
      if (!prev) return prev;
      const updatedMsgs = prev.messages.map(m => ({
        ...m,
        pinned: m.id === msgId ? newPinned : false,
      }));
      const pinnedMsg = newPinned ? updatedMsgs.find(m => m.id === msgId) ?? null : null;
      return { ...prev, messages: updatedMsgs, pinned: pinnedMsg };
    });
  }, [pseudo]);

  const scrollToMessage = useCallback((msgId: string) => {
    const el = msgRefs.current[msgId];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.style.outline = "2px solid var(--red)";
    el.style.borderRadius = "12px";
    setTimeout(() => { if (el) { el.style.outline = ""; el.style.borderRadius = ""; } }, 1000);
  }, []);

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
  const pinnedMsg = thread?.pinned ?? null;
  const canSend = (content.trim() || shareFilm) && !sending;

  if (error === "auth") return (
    <div className="flex flex-col items-center justify-center gap-3" style={{ height: containerH, background: "var(--bg)" }}>
      <span className="text-4xl">🔒</span>
      <p className="text-sm" style={{ color: "var(--text-3)" }}>Connexion requise pour accéder à la messagerie.</p>
      <Link href="/profil" className="text-sm font-semibold" style={{ color: "var(--red)" }}>Se connecter</Link>
    </div>
  );

  return (
    <div style={{ background: "var(--bg)", minHeight: containerH, display: "flex", justifyContent: "center" }}>
      <div className="flex flex-col w-full" style={{ height: containerH, maxWidth: 760, background: "var(--bg)" }}>

        {/* ── Header ─────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-3 sm:px-4 h-14 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}
        >
          <Link
            href="/profil?tab=messages"
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

        {/* ── Bannière message épinglé ────────────────────── */}
        {pinnedMsg && (
          <button
            onClick={() => scrollToMessage(pinnedMsg.id)}
            className="flex items-center gap-2 px-4 py-2 w-full text-left flex-shrink-0"
            style={{
              background: "rgba(220,38,38,0.06)",
              borderLeft: "3px solid var(--red)",
              borderBottom: "1px solid var(--border)",
              cursor: "pointer",
              border: "none",
            }}
          >
            <span style={{ fontSize: "0.8rem" }}>📌</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold" style={{ color: "var(--red)" }}>Message épinglé</p>
              <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>
                {pinnedMsg.film ? `🎬 ${pinnedMsg.film.titre}` : pinnedMsg.content}
              </p>
            </div>
          </button>
        )}

        {/* ── Zone messages ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 pt-4 pb-2 min-h-0">
          {error && error !== "auth" && (
            <div className="text-center py-10">
              <p className="text-sm mb-3" style={{ color: "var(--text-3)" }}>{error}</p>
              <button onClick={() => load(true)} style={{ color: "var(--red)", background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem" }}>
                Réessayer
              </button>
            </div>
          )}

          {!error && !thread && (
            <div className="flex flex-col gap-3 pt-2">
              {[60, 40, 75, 50].map((w, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                  <div className="h-9 rounded-2xl animate-pulse" style={{ width: `${w}%`, background: "var(--bg-2)" }} />
                </div>
              ))}
            </div>
          )}

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

          {grouped.map(({ dateStr, label, msgs }) => (
            <div key={dateStr}>
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

                // Mode édition inline
                if (editingId === msg.id) {
                  return (
                    <div key={msg.id} ref={el => { msgRefs.current[msg.id] = el; }} style={{ marginBottom: 10 }}>
                      <InlineEdit
                        initialContent={msg.content}
                        isMe={isMe}
                        onSave={nc => handleEditSave(msg.id, nc)}
                        onCancel={() => setEditingId(null)}
                      />
                    </div>
                  );
                }

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
                    editingId={editingId}
                    onPickerToggle={id => setPickerFor(p => p === id ? null : id)}
                    onPickerClose={() => setPickerFor(null)}
                    onReact={handleReact}
                    onReply={handleReply}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onPin={handlePin}
                    onScrollTo={scrollToMessage}
                    msgRef={el => { msgRefs.current[msg.id] = el; }}
                  />
                );
              })}
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* ── Film en attente de partage ──────────────────── */}
        {shareFilm && (
          <div
            className="flex items-center gap-3 px-4 py-2 flex-shrink-0"
            style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}
          >
            <span style={{ fontSize: "0.8rem" }}>🎬</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{shareFilm.titre}</p>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>{shareFilm.annee}</p>
            </div>
            <button
              onClick={() => setShareFilm(null)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
              style={{ background: "var(--bg-3)", border: "1px solid var(--border)", color: "var(--text-3)", cursor: "pointer" }}
            >✕</button>
          </div>
        )}

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

        {/* ── Film Search panel ───────────────────────────── */}
        {showFilmSearch && (
          <FilmSearch
            onSelect={film => { setShareFilm(film); setShowFilmSearch(false); }}
            onClose={() => setShowFilmSearch(false)}
          />
        )}

        {/* ── Composer ────────────────────────────────────── */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 px-3 sm:px-4 py-3 flex-shrink-0"
          style={{
            borderTop: (replyTo || shareFilm || showFilmSearch) ? "none" : "1px solid var(--border)",
            background: "var(--bg-2)",
          }}
        >
          {/* Bouton partage film */}
          <button
            type="button"
            onClick={() => { setShowFilmSearch(v => !v); setShareFilm(null); }}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base transition-colors"
            style={{
              background: showFilmSearch ? "var(--red)" : "var(--bg-3)",
              border: `1px solid ${showFilmSearch ? "var(--red)" : "var(--border)"}`,
              cursor: "pointer",
              color: showFilmSearch ? "white" : "var(--text-3)",
            }}
            title="Partager un film"
          >🎬</button>

          <input
            ref={inputRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
            onFocus={() => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 320)}
            placeholder={shareFilm ? "Ajouter un message…" : "Message…"}
            className="flex-1 px-4 py-2.5 rounded-full outline-none"
            style={{
              background: "var(--bg-3)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              minWidth: 0,
              fontSize: "1rem",
            }}
            disabled={sending}
          />

          <button
            type="submit"
            disabled={!canSend}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
            style={{
              background: canSend ? "var(--red)" : "var(--bg-3)",
              border: "none",
              cursor: !canSend ? "not-allowed" : "pointer",
            }}
          >
            {sending
              ? <span style={{ color: "var(--text-3)", fontSize: "0.75rem" }}>…</span>
              : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={canSend ? "white" : "var(--text-3)"}
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
