"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Props {
  defaultValue?: string;
  large?: boolean;
}

export default function SearchBar({ defaultValue = "", large = false }: Props) {
  const [q, setQ] = useState(defaultValue);
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/recherche?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className="flex items-center overflow-hidden"
        style={{
          background: "var(--bg)",
          border: "1.5px solid var(--border)",
          borderRadius: 10,
          boxShadow: large ? "0 8px 32px rgba(0,0,0,.12)" : "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--red)";
          e.currentTarget.style.boxShadow = "0 0 0 3px var(--red-dim)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.boxShadow = large ? "0 8px 32px rgba(0,0,0,.12)" : "none";
        }}
      >
        <span className="pl-4 pr-2" style={{ color: "var(--text-3)", fontSize: "0.9rem" }}>
          🔍
        </span>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Film, cinéma, réalisateur…"
          style={{
            flex: 1,
            padding: large ? "16px 0" : "10px 0",
            border: "none",
            outline: "none",
            background: "transparent",
            color: "var(--text)",
            fontSize: large ? "1rem" : "0.875rem",
          }}
        />
        <button
          type="submit"
          className="m-1.5 px-4 font-semibold text-white text-sm rounded-lg"
          style={{
            background: "var(--red)",
            padding: large ? "10px 20px" : "7px 16px",
            border: "none",
            cursor: "pointer",
            transition: "background 0.15s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--red-dk)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--red)")}
        >
          Rechercher
        </button>
      </div>
    </form>
  );
}
