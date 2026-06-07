// ─────────────────────────────────────────────────────────
//  Page admin — dashboard complet CinéRadar
//  Accès : /admin (réservé à l'admin via ADMIN_SECRET)
// ─────────────────────────────────────────────────────────

import { notFound } from "next/navigation";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic"; // toujours frais

export default async function AdminPage() {
  const API    = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const SECRET = process.env.ADMIN_SECRET ?? "";

  async function fetchAdmin(path: string) {
    const res = await fetch(`${API}/admin/dashboard/${path}`, {
      headers: { "x-admin-secret": SECRET },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  }

  if (!SECRET) {
    return <div style={{color:"red",padding:40}}>❌ ADMIN_SECRET manquant (vide)</div>;
  }

  const overview = await fetchAdmin("overview");

  if (!overview) {
    return <div style={{color:"red",padding:40}}>❌ Backend inaccessible — API: {API} — Secret défini: {SECRET ? "oui" : "non"}</div>;
  }

  const [users, films, geo, activity] = await Promise.all([
    fetchAdmin("users?limit=50"),
    fetchAdmin("films"),
    fetchAdmin("geo"),
    fetchAdmin("activity"),
  ]);

  return (
    <AdminDashboard
      overview={overview}
      users={users}
      films={films}
      geo={geo}
      activity={activity}
    />
  );
}
