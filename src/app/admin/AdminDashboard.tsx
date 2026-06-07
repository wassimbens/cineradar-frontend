"use client";

import { useState } from "react";
import Image from "next/image";

// ── Types ─────────────────────────────────────────────────

interface OverviewData {
  users: {
    total: number; verifies: number; premium: number;
    newThisWeek: number; newThisMonth: number;
    tauxVerification: number; tauxPremium: number;
  };
  contenu: {
    films: number; cinemas: number; seancesFutures: number;
    avis: number; alertesActives: number; filmsVus: number;
    watchlist: number; listes: number;
  };
  activiteRecente: { newAvisWeek: number; newAlertesMonth: number };
  inscriptionsParJour: Record<string, number>;
}

interface UserData {
  total: number; page: number; limit: number;
  users: Array<{
    id: string; pseudo: string | null; nom: string | null;
    email: string; avatar: string | null; ville: string | null;
    isPremium: boolean; emailVerified: boolean; isPublic: boolean;
    createdAt: string; genresPreferes: string[];
    _count: {
      filmsVus: number; filmsFavoris: number; watchlist: number;
      alertes: number; avis: number; following: number;
      followers: number; listesCreees: number;
    };
  }>;
}

interface FilmData {
  top25: Array<{
    film: { id: string; titre: string; affiche: string | null; annee: number | null; realisateur: string | null; _count: { seances: number } } | undefined;
    score: number; vus: number; watchlist: number; favoris: number; alertes: number; avis: number; seancesActives: number;
  }>;
}

interface GeoData {
  usersParVille: Array<{ ville: string; count: number }>;
  cinemasParVille: Array<{ ville: string; count: number }>;
  couverture: { avecVille: number; sansVille: number };
}

interface ActivityData {
  derniersInscrits: Array<{
    id: string; pseudo: string | null; nom: string | null;
    email: string; avatar: string | null; ville: string | null;
    isPremium: boolean; emailVerified: boolean; createdAt: string;
  }>;
  derniersAvis: Array<{
    id: string; note: number | null; commentaire: string | null; createdAt: string;
    user: { pseudo: string | null; avatar: string | null };
    film: { titre: string; affiche: string | null };
  }>;
  dernieresAlertes: Array<{
    id: string; createdAt: string;
    user: { pseudo: string | null };
    film: { titre: string; affiche: string | null } | null;
  }>;
  inscriptionsParJour: Record<string, number>;
  topGenres: Array<{ genre: string; count: number }>;
}

// ── Helpers ───────────────────────────────────────────────

function StatCard({ label, value, sub, color = "var(--red)" }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="card p-4" style={{ borderRadius: 12 }}>
      <p className="text-xs mb-1" style={{ color: "var(--text-3)" }}>{label}</p>
      <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{sub}</p>}
    </div>
  );
}

function Badge({ children, color = "#e74c3c" }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: color, color: "white" }}>
      {children}
    </span>
  );
}

function Avatar({ src, pseudo }: { src?: string | null; pseudo?: string | null }) {
  if (src) return (
    <Image src={src} alt={pseudo ?? ""} width={32} height={32}
      className="rounded-full object-cover flex-shrink-0"
      style={{ width: 32, height: 32 }} unoptimized />
  );
  const initials = (pseudo ?? "?").slice(0, 2).toUpperCase();
  return (
    <div className="flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white"
      style={{ width: 32, height: 32, background: "var(--red)" }}>
      {initials}
    </div>
  );
}

function MiniBar({ value, max, color = "var(--red)" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ background: "var(--bg-2)", borderRadius: 4, height: 6, width: "100%", minWidth: 60 }}>
      <div style={{ background: color, borderRadius: 4, height: 6, width: `${pct}%`, transition: "width .3s" }} />
    </div>
  );
}

// ── Onglet Overview ───────────────────────────────────────

function TabOverview({ data }: { data: OverviewData }) {
  const jours = Object.entries(data.inscriptionsParJour).sort(([a], [b]) => a.localeCompare(b));
  const maxInsc = Math.max(...jours.map(([, v]) => v), 1);

  return (
    <div>
      <h2 className="text-lg font-extrabold mb-4" style={{ color: "var(--text)" }}>Vue d'ensemble</h2>

      {/* Utilisateurs */}
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Utilisateurs</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Inscrits total" value={data.users.total} />
        <StatCard label="Premium" value={data.users.premium} sub={`${data.users.tauxPremium}% des inscrits`} color="#f39c12" />
        <StatCard label="Nouveaux cette semaine" value={data.users.newThisWeek} color="#27ae60" />
        <StatCard label="Nouveaux ce mois" value={data.users.newThisMonth} color="#2980b9" />
        <StatCard label="Emails vérifiés" value={data.users.verifies} sub={`${data.users.tauxVerification}% du total`} />
        <StatCard label="Avis postés (7j)" value={data.activiteRecente.newAvisWeek} color="#8e44ad" />
        <StatCard label="Alertes actives" value={data.contenu.alertesActives} color="#e67e22" />
        <StatCard label="Nouvelles alertes (30j)" value={data.activiteRecente.newAlertesMonth} color="#e67e22" />
      </div>

      {/* Contenu */}
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Contenu</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Films en base" value={data.contenu.films.toLocaleString("fr-FR")} />
        <StatCard label="Cinémas" value={data.contenu.cinemas.toLocaleString("fr-FR")} />
        <StatCard label="Séances futures" value={data.contenu.seancesFutures.toLocaleString("fr-FR")} color="#27ae60" />
        <StatCard label="Avis total" value={data.contenu.avis} color="#8e44ad" />
        <StatCard label="Films vus (total)" value={data.contenu.filmsVus.toLocaleString("fr-FR")} />
        <StatCard label="Watchlist (total)" value={data.contenu.watchlist.toLocaleString("fr-FR")} />
        <StatCard label="Listes créées" value={data.contenu.listes} />
      </div>

      {/* Graphique inscriptions */}
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Inscriptions ce mois</p>
      <div className="card p-4" style={{ borderRadius: 12 }}>
        <div className="flex items-end gap-1" style={{ height: 80 }}>
          {jours.map(([day, count]) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-1" title={`${day} : ${count}`}>
              <div style={{
                width: "100%", background: count > 0 ? "var(--red)" : "var(--bg-2)",
                borderRadius: "2px 2px 0 0",
                height: `${maxInsc > 0 ? Math.max(4, Math.round((count / maxInsc) * 72)) : 4}px`,
                transition: "height .3s",
              }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs" style={{ color: "var(--text-3)" }}>{jours[0]?.[0]?.slice(5)}</span>
          <span className="text-xs" style={{ color: "var(--text-3)" }}>{jours[jours.length - 1]?.[0]?.slice(5)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Onglet Utilisateurs ────────────────────────────────────

function TabUsers({ data }: { data: UserData }) {
  const [search, setSearch] = useState("");
  const filtered = data.users.filter(u =>
    !search || [u.pseudo, u.nom, u.email, u.ville].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-extrabold" style={{ color: "var(--text)" }}>
          Utilisateurs <span style={{ color: "var(--red)" }}>({data.total})</span>
        </h2>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher pseudo, email, ville…"
          className="px-3 py-2 text-sm rounded-xl"
          style={{
            background: "var(--bg-2)", border: "1px solid var(--border)",
            color: "var(--text)", width: 260, outline: "none",
          }}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border)" }}>
              {["Utilisateur", "Email", "Ville", "Inscription", "Activité", "Statut"].map(h => (
                <th key={h} className="text-left py-2 px-3 text-xs font-semibold" style={{ color: "var(--text-3)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }} className="hover:bg-[var(--bg-2)]">
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <Avatar src={u.avatar} pseudo={u.pseudo} />
                    <div>
                      <p className="font-semibold text-xs" style={{ color: "var(--text)" }}>
                        @{u.pseudo ?? "—"}
                      </p>
                      {u.nom && <p className="text-xs" style={{ color: "var(--text-3)" }}>{u.nom}</p>}
                    </div>
                  </div>
                </td>
                <td className="py-2 px-3 text-xs" style={{ color: "var(--text-2)" }}>{u.email}</td>
                <td className="py-2 px-3 text-xs" style={{ color: "var(--text-3)" }}>{u.ville ?? "—"}</td>
                <td className="py-2 px-3 text-xs" style={{ color: "var(--text-3)", whiteSpace: "nowrap" }}>
                  {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                </td>
                <td className="py-2 px-3">
                  <div className="flex flex-wrap gap-1 text-xs" style={{ color: "var(--text-3)" }}>
                    {u._count.filmsVus > 0 && <span title="Films vus">👁 {u._count.filmsVus}</span>}
                    {u._count.avis > 0 && <span title="Avis">⭐ {u._count.avis}</span>}
                    {u._count.alertes > 0 && <span title="Alertes">🔔 {u._count.alertes}</span>}
                    {u._count.followers > 0 && <span title="Abonnés">👥 {u._count.followers}</span>}
                    {u._count.listesCreees > 0 && <span title="Listes">📋 {u._count.listesCreees}</span>}
                  </div>
                </td>
                <td className="py-2 px-3">
                  <div className="flex flex-wrap gap-1">
                    {u.isPremium && <Badge color="#f39c12">Premium</Badge>}
                    {u.emailVerified && <Badge color="#27ae60">Vérifié</Badge>}
                    {!u.emailVerified && <Badge color="#95a5a6">Non vérifié</Badge>}
                    {!u.isPublic && <Badge color="#7f8c8d">Privé</Badge>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-8 text-sm" style={{ color: "var(--text-3)" }}>Aucun résultat</p>
        )}
      </div>
    </div>
  );
}

// ── Onglet Films ──────────────────────────────────────────

function TabFilms({ data }: { data: FilmData }) {
  const maxScore = data.top25[0]?.score ?? 1;

  return (
    <div>
      <h2 className="text-lg font-extrabold mb-1" style={{ color: "var(--text)" }}>Films les plus populaires</h2>
      <p className="text-xs mb-4" style={{ color: "var(--text-3)" }}>
        Score combiné : films vus ×4 · watchlist ×3 · favoris ×3 · alertes ×2 · avis ×2
      </p>

      <div className="flex flex-col gap-3">
        {data.top25.map((item, i) => (
          <div key={i} className="card p-3 flex items-center gap-3" style={{ borderRadius: 12 }}>
            <span className="text-lg font-extrabold flex-shrink-0 w-7 text-center" style={{ color: i < 3 ? "var(--red)" : "var(--text-3)" }}>
              {i + 1}
            </span>

            {item.film?.affiche ? (
              <Image src={item.film.affiche} alt={item.film.titre ?? ""} width={36} height={54}
                className="rounded flex-shrink-0 object-cover"
                style={{ width: 36, height: 54 }} unoptimized />
            ) : (
              <div className="flex-shrink-0 rounded" style={{ width: 36, height: 54, background: "var(--bg-2)" }} />
            )}

            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate" style={{ color: "var(--text)" }}>
                {item.film?.titre ?? "Film inconnu"}
              </p>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                {item.film?.realisateur ?? ""} {item.film?.annee ? `· ${item.film.annee}` : ""}
              </p>
              <MiniBar value={item.score} max={maxScore} />
            </div>

            <div className="flex flex-wrap gap-2 text-xs flex-shrink-0">
              <span title="Films vus" style={{ color: "#3498db" }}>👁 {item.vus}</span>
              <span title="Watchlist" style={{ color: "#9b59b6" }}>📌 {item.watchlist}</span>
              <span title="Favoris" style={{ color: "#e74c3c" }}>❤️ {item.favoris}</span>
              <span title="Alertes" style={{ color: "#f39c12" }}>🔔 {item.alertes}</span>
              <span title="Avis" style={{ color: "#2ecc71" }}>⭐ {item.avis}</span>
              {item.seancesActives > 0 && (
                <span title="Séances futures" style={{ color: "var(--red)" }}>🎬 {item.seancesActives}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Onglet Géographie ─────────────────────────────────────

function TabGeo({ data }: { data: GeoData }) {
  const totalUsers = data.couverture.avecVille + data.couverture.sansVille;
  const tauxRenseigne = totalUsers > 0 ? Math.round((data.couverture.avecVille / totalUsers) * 100) : 0;
  const maxUsers = data.usersParVille[0]?.count ?? 1;
  const maxCinemas = data.cinemasParVille[0]?.count ?? 1;

  return (
    <div>
      <h2 className="text-lg font-extrabold mb-4" style={{ color: "var(--text)" }}>Géographie</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Utilisateurs avec ville" value={data.couverture.avecVille} sub={`${tauxRenseigne}% des inscrits`} />
        <StatCard label="Sans ville renseignée" value={data.couverture.sansVille} color="#95a5a6" />
        <StatCard label="Villes représentées" value={data.usersParVille.length} color="#2980b9" />
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
            Top 20 villes — Utilisateurs
          </p>
          <div className="flex flex-col gap-2">
            {data.usersParVille.map((v, i) => (
              <div key={v.ville} className="flex items-center gap-2">
                <span className="text-xs w-5 text-right flex-shrink-0" style={{ color: "var(--text-3)" }}>{i + 1}</span>
                <span className="text-sm flex-shrink-0" style={{ width: 140, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {v.ville}
                </span>
                <div className="flex-1">
                  <MiniBar value={v.count} max={maxUsers} color="#3498db" />
                </div>
                <span className="text-xs font-bold flex-shrink-0" style={{ color: "#3498db", width: 24, textAlign: "right" }}>{v.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>
            Top 20 villes — Cinémas
          </p>
          <div className="flex flex-col gap-2">
            {data.cinemasParVille.map((v, i) => (
              <div key={v.ville} className="flex items-center gap-2">
                <span className="text-xs w-5 text-right flex-shrink-0" style={{ color: "var(--text-3)" }}>{i + 1}</span>
                <span className="text-sm flex-shrink-0" style={{ width: 140, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {v.ville}
                </span>
                <div className="flex-1">
                  <MiniBar value={v.count} max={maxCinemas} color="var(--red)" />
                </div>
                <span className="text-xs font-bold flex-shrink-0" style={{ color: "var(--red)", width: 24, textAlign: "right" }}>{v.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Onglet Activité ───────────────────────────────────────

function TabActivity({ data }: { data: ActivityData }) {
  const maxGenre = data.topGenres[0]?.count ?? 1;

  return (
    <div>
      <h2 className="text-lg font-extrabold mb-4" style={{ color: "var(--text)" }}>Activité récente</h2>

      <div className="grid sm:grid-cols-2 gap-6">

        {/* Derniers inscrits */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Derniers inscrits</p>
          <div className="flex flex-col gap-2">
            {data.derniersInscrits.map(u => (
              <div key={u.id} className="card px-3 py-2 flex items-center gap-3" style={{ borderRadius: 10 }}>
                <Avatar src={u.avatar} pseudo={u.pseudo} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                    @{u.pseudo ?? "—"}
                    {u.isPremium && <span className="ml-1 text-xs" style={{ color: "#f39c12" }}>★</span>}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>{u.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs" style={{ color: "var(--text-3)" }}>
                    {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                  {u.ville && <span className="text-xs" style={{ color: "var(--text-3)" }}>{u.ville}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Genres préférés */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Genres préférés des utilisateurs</p>
            <div className="flex flex-col gap-2">
              {data.topGenres.map(g => (
                <div key={g.genre} className="flex items-center gap-2">
                  <span className="text-sm" style={{ width: 120, color: "var(--text)", flexShrink: 0 }}>{g.genre}</span>
                  <div className="flex-1">
                    <MiniBar value={g.count} max={maxGenre} color="#8e44ad" />
                  </div>
                  <span className="text-xs font-bold" style={{ color: "#8e44ad", width: 24, textAlign: "right", flexShrink: 0 }}>{g.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dernières alertes */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Dernières alertes créées</p>
            <div className="flex flex-col gap-2">
              {data.dernieresAlertes.slice(0, 8).map(a => (
                <div key={a.id} className="card px-3 py-2 flex items-center gap-2" style={{ borderRadius: 10 }}>
                  {a.film?.affiche && (
                    <Image src={a.film.affiche} alt={a.film.titre} width={24} height={36}
                      className="rounded flex-shrink-0 object-cover"
                      style={{ width: 24, height: 36 }} unoptimized />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{a.film?.titre ?? "Film inconnu"}</p>
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>@{a.user.pseudo ?? "?"}</p>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: "var(--text-3)" }}>
                    {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Derniers avis */}
      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)" }}>Derniers avis postés</p>
        <div className="flex flex-col gap-2">
          {data.derniersAvis.map(a => (
            <div key={a.id} className="card px-3 py-2 flex items-start gap-3" style={{ borderRadius: 10 }}>
              <Avatar src={a.user.avatar} pseudo={a.user.pseudo} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>@{a.user.pseudo ?? "?"}</span>
                  <span className="text-xs" style={{ color: "var(--text-3)" }}>sur</span>
                  <span className="text-xs font-semibold truncate" style={{ color: "var(--red)" }}>{a.film.titre}</span>
                  {a.note && <span className="text-xs" style={{ color: "#f39c12" }}>{'⭐'.repeat(Math.round(a.note / 2))}</span>}
                </div>
                {a.commentaire && (
                  <p className="text-xs mt-1" style={{ color: "var(--text-3)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {a.commentaire}
                  </p>
                )}
              </div>
              <span className="text-xs flex-shrink-0" style={{ color: "var(--text-3)" }}>
                {new Date(a.createdAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard principal ───────────────────────────────────

const TABS = [
  { id: "overview",  label: "Vue d'ensemble", icon: "📊" },
  { id: "users",     label: "Utilisateurs",   icon: "👥" },
  { id: "films",     label: "Films",          icon: "🎬" },
  { id: "geo",       label: "Géographie",     icon: "🗺️" },
  { id: "activity",  label: "Activité",       icon: "⚡" },
];

export default function AdminDashboard({
  overview, users, films, geo, activity,
}: {
  overview: OverviewData;
  users: UserData;
  films: FilmData;
  geo: GeoData;
  activity: ActivityData;
}) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="px-4 py-8 mx-auto" style={{ maxWidth: 1100 }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
            🎬 Admin Dashboard
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
            Données en temps réel — {new Date().toLocaleString("fr-FR")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "var(--red)", color: "white" }}>
            {overview.users.total} inscrits
          </span>
          <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "#27ae60", color: "white" }}>
            {overview.users.premium} premium
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition-colors"
            style={{
              background: activeTab === tab.id ? "var(--red)" : "var(--bg-2)",
              color: activeTab === tab.id ? "white" : "var(--text-2)",
              border: "1px solid",
              borderColor: activeTab === tab.id ? "var(--red)" : "var(--border)",
              cursor: "pointer",
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="card p-5" style={{ borderRadius: 16 }}>
        {activeTab === "overview"  && <TabOverview  data={overview}  />}
        {activeTab === "users"     && <TabUsers     data={users}     />}
        {activeTab === "films"     && <TabFilms     data={films}     />}
        {activeTab === "geo"       && <TabGeo       data={geo}       />}
        {activeTab === "activity"  && <TabActivity  data={activity}  />}
      </div>
    </div>
  );
}
