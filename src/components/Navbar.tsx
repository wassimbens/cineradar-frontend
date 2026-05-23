"use client";
import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import AlerteModal from "./AlerteModal";

const NAV_LINKS = [
  { label: "Films",      href: "/films" },
  { label: "Classiques", href: "/films/classiques" },
  { label: "Cinémas",    href: "/recherche?type=cinemas" },
  { label: "Mon profil", href: "/profil" },
  { label: "✦ Pro", href: "/premium", special: true },
];

// ── Liens avec état actif (nécessite useSearchParams) ────

function NavLinks({ onClose, isLoggedIn, navAvatar, navInitiales, unreadNotifs, unreadMessages }: { onClose?: () => void; isLoggedIn: boolean; navAvatar?: string | null; navInitiales?: string; unreadNotifs?: number; unreadMessages?: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");

  const isActive = (href: string) => {
    if (href === "/films")
      return (pathname.startsWith("/films") && !pathname.startsWith("/films/classiques")) ||
        (pathname === "/recherche" && type === "films");
    if (href === "/films/classiques")
      return pathname.startsWith("/films/classiques");
    if (href.includes("cinemas"))
      return pathname.startsWith("/cinemas") || (pathname === "/recherche" && type === "cinemas");
    if (href === "/profil")
      return pathname.startsWith("/profil");
    if (href === "/listes")
      return pathname.startsWith("/listes");
    return false;
  };

  return (
    <>
      {NAV_LINKS.map((l) => (
        <Link
          key={l.label}
          href={l.href}
          onClick={onClose}
          className="px-4 py-1.5 rounded-lg text-sm font-medium no-underline transition-colors flex items-center gap-1.5"
          style={
            (l as { special?: boolean }).special
              ? { color: "var(--red)", fontWeight: 700, background: "transparent" }
              : {
                  color:      isActive(l.href) ? "var(--text)"  : "var(--text-3)",
                  background: isActive(l.href) ? "var(--bg-3)"  : "transparent",
                }
          }
        >
          {l.href === "/profil" && isLoggedIn && (
            navAvatar
              ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={navAvatar} alt="Avatar" className="rounded-full flex-shrink-0 object-cover" style={{ width: 20, height: 20 }} />
              ) : (
                <span
                  className="rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold"
                  style={{ width: 20, height: 20, fontSize: 9, background: "var(--red)" }}
                >
                  {navInitiales ?? "?"}
                </span>
              )
          )}
          {l.label}
        </Link>
      ))}
      {isLoggedIn && (
        <Link
          href="/listes"
          onClick={onClose}
          className="px-4 py-1.5 rounded-lg text-sm font-medium no-underline transition-colors"
          style={{
            color:      isActive("/listes") ? "var(--text)"  : "var(--text-3)",
            background: isActive("/listes") ? "var(--bg-3)"  : "transparent",
          }}
        >
          Mes listes
        </Link>
      )}
      {isLoggedIn && (
        <Link
          href="/messages"
          onClick={onClose}
          className="relative px-3 py-1.5 rounded-lg text-sm font-medium no-underline transition-colors flex items-center"
          style={{ color: "var(--text-3)", background: "transparent" }}
          title="Messages"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {(unreadMessages ?? 0) > 0 && (
            <span
              className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full text-white flex items-center justify-center"
              style={{ background: "var(--red)", fontSize: 9, fontWeight: 700 }}
            >
              {(unreadMessages ?? 0) > 9 ? "9+" : unreadMessages}
            </span>
          )}
        </Link>
      )}
      {isLoggedIn && (
        <Link
          href="/profil?tab=notifications"
          onClick={onClose}
          className="relative px-3 py-1.5 rounded-lg text-sm font-medium no-underline transition-colors flex items-center"
          style={{ color: "var(--text-3)", background: "transparent" }}
          title="Notifications"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {(unreadNotifs ?? 0) > 0 && (
            <span
              className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full text-white flex items-center justify-center"
              style={{ background: "var(--red)", fontSize: 9, fontWeight: 700 }}
            >
              {(unreadNotifs ?? 0) > 9 ? "9+" : unreadNotifs}
            </span>
          )}
        </Link>
      )}
    </>
  );
}

function NavLinksFallback() {
  return (
    <>
      {NAV_LINKS.map(({ label }) => (
        <span key={label} className="px-4 py-1.5 rounded-lg text-sm font-medium" style={{ color: "var(--text-3)" }}>
          {label}
        </span>
      ))}
    </>
  );
}

// ── Navbar principale ─────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

export default function Navbar() {
  const [modalOpen, setModalOpen]   = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [navAvatar, setNavAvatar]   = useState<string | null>(null);
  const [navInitiales, setNavInitiales] = useState<string>("?");
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const pathname = usePathname();

  // Détecter la connexion, charger l'avatar et les initiales
  useEffect(() => {
    const token = localStorage.getItem("cineradar_token");
    const email = localStorage.getItem("cineradar_email");
    setIsLoggedIn(!!(token || email));
    if (token || email) {
      setNavAvatar(localStorage.getItem("cineradar_avatar"));
      const pseudo = localStorage.getItem("cineradar_pseudo");
      if (pseudo) setNavInitiales(pseudo.slice(0, 2).toUpperCase());
      else if (email) setNavInitiales(email.slice(0, 2).toUpperCase());
    }
  }, []);

  // Sync à chaque navigation
  useEffect(() => {
    const token = localStorage.getItem("cineradar_token");
    const email = localStorage.getItem("cineradar_email");
    if (!(token || email)) return;
    setNavAvatar(localStorage.getItem("cineradar_avatar"));
    const pseudo = localStorage.getItem("cineradar_pseudo");
    if (pseudo) setNavInitiales(pseudo.slice(0, 2).toUpperCase());
    else if (email) setNavInitiales(email.slice(0, 2).toUpperCase());
  }, [pathname]);

  // Charger les compteurs non lus (notifications + messages)
  useEffect(() => {
    const token = localStorage.getItem("cineradar_token");
    if (!token) return;
    fetch(`${API}/api/notifications/unread-count`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { count: 0 })
      .then((d: { count: number }) => setUnreadNotifs(d.count))
      .catch(() => {});
    fetch(`${API}/api/messages/unread-count`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { count: 0 })
      .then((d: { count: number }) => setUnreadMessages(d.count))
      .catch(() => {});
  }, [pathname]);

  // Fermer le menu mobile à chaque changement de page
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <>
      <nav
        className="sticky top-0 z-40"
        style={{
          background: "var(--bg)",
          borderBottom: "1px solid var(--border)",
          transition: "background 0.2s",
        }}
      >
        {/* Barre principale */}
        <div className="flex items-center justify-between px-6 h-14">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 font-extrabold text-lg no-underline whitespace-nowrap"
            style={{ color: "var(--text)", letterSpacing: "-0.02em" }}
          >
            <Image
              src="/logo-cineradar.png"
              alt="CinéRadar"
              width={44}
              height={44}
              className="flex-shrink-0 rounded-xl"
              priority
              unoptimized
            />
            <span>{"Ciné"}<span style={{ color: "var(--red)" }}>{"Radar"}</span></span>
          </Link>

          {/* Liens desktop */}
          <div className="hidden md:flex gap-1">
            <Suspense fallback={<NavLinksFallback />}>
              <NavLinks isLoggedIn={isLoggedIn} navAvatar={navAvatar} navInitiales={navInitiales} unreadNotifs={unreadNotifs} unreadMessages={unreadMessages} />
            </Suspense>
          </div>

          {/* Droite */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* Bouton alerte — masqué sur mobile (remplacé par menu) */}
            <button
              onClick={() => setModalOpen(true)}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-white hidden sm:block"
              style={{ background: "var(--red)", border: "none", cursor: "pointer" }}
            >
              Créer une alerte
            </button>

            {/* Hamburger — visible sur mobile uniquement */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg gap-1"
              style={{ background: "var(--bg-2)", border: "1px solid var(--border)", cursor: "pointer" }}
              aria-label="Menu"
            >
              <span
                className="block rounded-full transition-all"
                style={{
                  width: 16, height: 2, background: "var(--text)",
                  transform: menuOpen ? "translateY(5px) rotate(45deg)" : "none",
                }}
              />
              <span
                className="block rounded-full transition-all"
                style={{
                  width: 16, height: 2, background: "var(--text)",
                  opacity: menuOpen ? 0 : 1,
                }}
              />
              <span
                className="block rounded-full transition-all"
                style={{
                  width: 16, height: 2, background: "var(--text)",
                  transform: menuOpen ? "translateY(-5px) rotate(-45deg)" : "none",
                }}
              />
            </button>
          </div>
        </div>

        {/* Menu mobile déroulant */}
        {menuOpen && (
          <div
            className="md:hidden flex flex-col px-4 pb-4 gap-1"
            style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}
          >
            <Suspense fallback={<NavLinksFallback />}>
              <NavLinks onClose={() => setMenuOpen(false)} isLoggedIn={isLoggedIn} navAvatar={navAvatar} navInitiales={navInitiales} unreadNotifs={unreadNotifs} unreadMessages={unreadMessages} />
            </Suspense>
            <button
              onClick={() => { setMenuOpen(false); setModalOpen(true); }}
              className="mt-2 w-full py-2.5 rounded-lg text-sm font-semibold text-white text-center"
              style={{ background: "var(--red)", border: "none", cursor: "pointer" }}
            >
              🔔 Créer une alerte
            </button>
          </div>
        )}
      </nav>

      {modalOpen && <AlerteModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
