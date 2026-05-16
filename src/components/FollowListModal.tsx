"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { UserSearch } from "@/lib/api";

interface Props {
  title: string;
  users: UserSearch[];
  loading: boolean;
  onClose: () => void;
}

export default function FollowListModal({ title, users, loading, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:w-96 rounded-t-2xl sm:rounded-2xl flex flex-col"
        style={{
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
          maxHeight: "75vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="font-bold text-sm" style={{ color: "var(--text)" }}>{title}</p>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: "var(--bg-3)", color: "var(--text-3)", border: "none", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        {/* Liste */}
        <div className="overflow-y-auto flex-1">
          {loading && (
            <p className="text-center py-8 text-sm" style={{ color: "var(--text-3)" }}>Chargement…</p>
          )}
          {!loading && users.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: "var(--text-3)" }}>Aucun utilisateur</p>
          )}
          {!loading && users.map((u) => (
            <Link
              key={u.id}
              href={`/profil/${u.pseudo}`}
              onClick={onClose}
              className="flex items-center gap-3 px-5 py-3 no-underline transition-colors"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div
                className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs text-white overflow-hidden"
                style={{ background: "var(--red)" }}
              >
                {u.avatar
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={u.avatar} alt={u.pseudo} className="w-full h-full object-cover" />
                  : (u.nom ?? u.pseudo ?? "?").slice(0, 2).toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>@{u.pseudo}</p>
                {u.nom && <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>{u.nom}</p>}
              </div>
              <p className="text-xs flex-shrink-0" style={{ color: "var(--text-3)" }}>
                {u._count.filmsVus} films
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
