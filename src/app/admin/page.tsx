export const dynamic = "force-dynamic";

export default async function AdminPage() {
  return <div style={{ padding: 40, color: "white", background: "#111" }}>✅ Page admin accessible — API: {process.env.NEXT_PUBLIC_API_URL ?? "non défini"} — Secret: {process.env.ADMIN_SECRET ? "défini" : "VIDE"}</div>;
}
