// ─────────────────────────────────────────────────────────
//  Fonctions fetch vers le backend CinéRadar
// ─────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

// ── Types ─────────────────────────────────────────────────

export interface Film {
  id: string;
  titre: string;
  titreOriginal: string | null;
  synopsis: string | null;
  affiche: string | null;
  duree: number | null;
  genres: string[];
  realisateur: string | null;
  acteurs: string[];
  annee: number | null;
  tmdbNote?: number | null;
  imdbNote?: number | null;
  imdbId?: string | null;
  imdbVotes?: number | null;
  seancesCount?: number;
}

export interface Cinema {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  codePostal: string;
  latitude: number | null;
  longitude: number | null;
  siteWeb: string | null;
  telephone: string | null;
  chaine: string | null;
  sallesCount?: number;
  seancesAujourdhui?: number;
  salles?: { id: string; nom: string; capacite: number | null }[];
}

export interface Seance {
  id: string;
  dateHeure: string;
  version: "VO" | "VF" | "VOSTFR";
  format: string | null;
  prix: number | null;
  salleNom: string;
}

export interface SeancesParCinema {
  cinema: {
    id: string;
    nom: string;
    adresse: string;
    ville: string;
    codePostal: string;
    latitude: number | null;
    longitude: number | null;
  };
  seances: Seance[];
}

export interface ProgrammeLigne {
  film: {
    id: string;
    titre: string;
    titreOriginal: string | null;
    affiche: string | null;
    duree: number | null;
    genres: string[];
    realisateur: string | null;
  };
  seances: Seance[];
}

export interface SearchResult {
  films: Film[];
  cinemas: Cinema[];
  total: number;
}

export type CatalogSort = "titre" | "annee_desc" | "annee_asc" | "seances";

export interface CatalogFilters {
  q?: string;
  genre?: string;
  decennie?: number;
  sort?: CatalogSort;
  page?: number;
  limit?: number;
}

export interface CatalogResult {
  films: Film[];
  total: number;
  page: number;
  totalPages: number;
}

// ── Fetch helper ──────────────────────────────────────────

async function apiFetch<T>(path: string, revalidate = 1800): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate }, // cache Next.js 30 min
    signal: AbortSignal.timeout(8_000), // timeout 8s si le backend ne répond pas
  });
  if (!res.ok) throw new Error(`Erreur API ${res.status} sur ${path}`);
  return res.json() as Promise<T>;
}

// ── Fonctions exposées ────────────────────────────────────

export const api = {
  searchFilms: (q: string) =>
    apiFetch<Film[]>(`/api/films?q=${encodeURIComponent(q)}`),

  getFilm: (id: string) =>
    apiFetch<Film>(`/api/films/${id}`),

  getFilmSeances: (
    id: string,
    params: { ville?: string; date?: string; version?: string } = {}
  ) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return apiFetch<SeancesParCinema[]>(
      `/api/films/${id}/seances${qs ? `?${qs}` : ""}`,
      300 // 5 min (séances changent plus souvent)
    );
  },

  getCinemas: (ville: string) =>
    apiFetch<Cinema[]>(`/api/cinemas?ville=${encodeURIComponent(ville)}`),

  getCinema: (id: string) =>
    apiFetch<Cinema>(`/api/cinemas/${id}`),

  getCinemaProgramme: (id: string, date?: string) =>
    apiFetch<ProgrammeLigne[]>(
      `/api/cinemas/${id}/programme${date ? `?date=${date}` : ""}`,
      300
    ),

  search: (q: string) =>
    apiFetch<SearchResult>(`/api/search?q=${encodeURIComponent(q)}`),

  getStats: () =>
    apiFetch<{ films: number; cinemas: number; seances: number }>("/api/stats", 900),

  getTrendingFilms: () =>
    apiFetch<Film[]>("/api/films/trending", 60 * 10),

  getClassicFilms: () =>
    apiFetch<Film[]>("/api/films/classics", 60 * 60),

  getAllClassicFilms: () =>
    apiFetch<Film[]>("/api/films/all-classics", 60 * 60 * 2),

  getAllFilms: () =>
    apiFetch<Film[]>("/api/films?q=", 1800),

  getCatalogFilms: (filters: CatalogFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.q)        params.set("q", filters.q);
    if (filters.genre)    params.set("genre", filters.genre);
    if (filters.decennie) params.set("decennie", String(filters.decennie));
    if (filters.sort)     params.set("sort", filters.sort);
    if (filters.page)     params.set("page", String(filters.page));
    if (filters.limit)    params.set("limit", String(filters.limit));
    // Déclenche la route catalogue enrichie (sinon retombe sur la route simple)
    if (!params.has("sort")) params.set("sort", "seances");
    return apiFetch<CatalogResult>(`/api/films?${params.toString()}`, 900);
  },

  getCinemasNearby: (lat: number, lng: number, radius = 15) =>
    apiFetch<(Cinema & { distanceKm: number })[]>(
      `/api/cinemas/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
      60 * 5 // 5 min
    ),

  getFilmRating: (id: string) =>
    apiFetch<{ note: number | null; count: number }>(`/api/films/${id}/rating`, 60 * 5),

  getFilmTrailer: (id: string) =>
    apiFetch<{ youtubeId: string | null }>(`/api/films/${id}/trailer`, 60 * 60 * 24),

  getFilmDates: (id: string) =>
    apiFetch<{ dates: string[] }>(`/api/films/${id}/dates`, 60 * 15),
};

// ── Types Profil ──────────────────────────────────────────

export interface FilmResume {
  id: string;
  titre: string;
  titreOriginal: string | null;
  affiche: string | null;
  annee: number | null;
  realisateur: string | null;
  genres: string[];
}

export interface CinemaResume {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  chaine: string | null;
}

export interface AvisUtilisateur {
  filmId: string;
  film: FilmResume;
  note: number | null;
  texte: string | null;
  updatedAt: string;
}

export interface FilmVuItem {
  id: string;
  film: FilmResume;
  cinemaId: string | null;
  dateVu: string;
}

export interface GenreStat {
  genre: string;
  count: number;
}

export interface RealisateurStat {
  realisateur: string;
  count: number;
}

export interface FilmFavoriItem extends FilmResume {
  position: number;
}

export interface Profil {
  id: string;
  email: string;
  pseudo: string | null;
  nom: string | null;
  avatar: string | null;
  bio: string | null;
  ville: string | null;
  genresPreferes: string[];
  createdAt: string;
  filmsFavoris: FilmFavoriItem[];
  watchlist: FilmResume[];
  cinemasFavoris: CinemaResume[];
  avis: AvisUtilisateur[];
  filmsVus: FilmVuItem[];
  stats: { favoris: number; watchlist: number; avis: number; cinemas: number; filmsVus: number };
  genresStats: GenreStat[];
  realisateursStats: RealisateurStat[];
  isPremium?: boolean;
}

// ── Fonctions profil (client-side fetch, pas de cache ISR) ─

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003";

async function clientFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json() as Promise<T>;
}

export const profilApi = {
  getProfil: (email: string) =>
    clientFetch<Profil>(`/api/profil/${encodeURIComponent(email)}`),

  addFavori: (email: string, filmId: string, position?: number) =>
    clientFetch<{ ok: boolean }>(`/api/profil/${encodeURIComponent(email)}/favoris`, {
      method: "POST",
      body: JSON.stringify({ filmId, position }),
    }),

  reorderFavoris: (email: string, items: { filmId: string; position: number }[]) =>
    clientFetch<{ ok: boolean }>(`/api/profil/${encodeURIComponent(email)}/favoris/reorder`, {
      method: "PUT",
      body: JSON.stringify(items),
    }),

  removeFavori: (email: string, filmId: string) =>
    clientFetch<{ ok: boolean }>(`/api/profil/${encodeURIComponent(email)}/favoris/${filmId}`, {
      method: "DELETE",
    }),

  addWatchlist: (email: string, filmId: string) =>
    clientFetch<{ ok: boolean }>(`/api/profil/${encodeURIComponent(email)}/watchlist`, {
      method: "POST",
      body: JSON.stringify({ filmId }),
    }),

  removeWatchlist: (email: string, filmId: string) =>
    clientFetch<{ ok: boolean }>(`/api/profil/${encodeURIComponent(email)}/watchlist/${filmId}`, {
      method: "DELETE",
    }),

  addCinema: (email: string, cinemaId: string) =>
    clientFetch<{ ok: boolean }>(`/api/profil/${encodeURIComponent(email)}/cinemas`, {
      method: "POST",
      body: JSON.stringify({ cinemaId }),
    }),

  removeCinema: (email: string, cinemaId: string) =>
    clientFetch<{ ok: boolean }>(`/api/profil/${encodeURIComponent(email)}/cinemas/${cinemaId}`, {
      method: "DELETE",
    }),

  upsertAvis: (email: string, filmId: string, data: { note?: number; texte?: string }) =>
    clientFetch<{ ok: boolean }>(`/api/profil/${encodeURIComponent(email)}/avis/${filmId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteAvis: (email: string, filmId: string) =>
    clientFetch<{ ok: boolean }>(`/api/profil/${encodeURIComponent(email)}/avis/${filmId}`, {
      method: "DELETE",
    }),

  addFilmVu: (email: string, filmId: string, cinemaId?: string) =>
    clientFetch<{ ok: boolean }>(`/api/profil/${encodeURIComponent(email)}/films-vus`, {
      method: "POST",
      body: JSON.stringify({ filmId, cinemaId }),
    }),

  removeFilmVu: (email: string, id: string) =>
    clientFetch<{ ok: boolean }>(`/api/profil/${encodeURIComponent(email)}/films-vus/${id}`, {
      method: "DELETE",
    }),

  updateProfil: (email: string, data: { nom?: string; avatar?: string; bio?: string; ville?: string; genresPreferes?: string[]; pseudo?: string }) =>
    clientFetch<{ ok: boolean }>(`/api/profil/${encodeURIComponent(email)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// ── Types Auth ────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  pseudo: string | null;
  nom: string | null;
  avatar?: string | null;
  emailVerified?: boolean;
  isPremium?: boolean;
  premiumUntil?: string | null;
}

// ── Types social ──────────────────────────────────────────

export interface UserSearch {
  id: string;
  pseudo: string;
  nom: string | null;
  avatar: string | null;
  bio: string | null;
  ville: string | null;
  _count: { filmsVus: number; avis: number; following: number; followers: number };
}

export interface PublicProfil {
  id: string;
  pseudo: string;
  nom: string | null;
  avatar: string | null;
  bio: string | null;
  ville: string | null;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  filmsFavoris: (FilmResume & { position: number })[];
  watchlist: FilmResume[];
  avis: AvisUtilisateur[];
  filmsVus: FilmVuItem[];
  stats: { filmsVus: number; watchlist: number; avis: number; favoris: number };
}

// ── Auth API (client-side, envoie Bearer token) ────────────

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cineradar_token");
}

async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const hasBody = init?.body !== undefined && init.body !== null;
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Erreur ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const authApi = {
  register: (data: { email: string; pseudo: string; password: string; nom?: string }) =>
    authFetch<{ ok: boolean; token: string; user: AuthUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    authFetch<{ ok: boolean; token: string; user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () =>
    authFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),

  me: () =>
    authFetch<AuthUser>("/api/auth/me"),

  setPassword: (data: { email: string; password: string; pseudo?: string; nom?: string }) =>
    authFetch<{ ok: boolean; token: string; user: AuthUser }>("/api/auth/set-password", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updatePseudo: (pseudo: string) =>
    authFetch<{ ok: boolean; token: string; pseudo: string }>("/api/auth/update-pseudo", {
      method: "PATCH",
      body: JSON.stringify({ pseudo }),
    }),

  forgotPassword: (email: string) =>
    authFetch<{ ok: boolean }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    authFetch<{ ok: boolean; message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),

  resendVerification: () =>
    authFetch<{ ok: boolean }>("/api/auth/resend-verification", { method: "POST" }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    authFetch<{ ok: boolean; message: string }>("/api/auth/change-password", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  changeEmail: (data: { newEmail: string; password: string }) =>
    authFetch<{ ok: boolean; token: string; email: string; message: string }>("/api/auth/change-email", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteAccount: (password: string) =>
    authFetch<{ ok: boolean; message: string }>("/api/auth/delete-account", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    }),
};

// ── Types Messages ────────────────────────────────────────

export interface MessageConversation {
  partner: { id: string; pseudo: string; nom: string | null; avatar: string | null };
  lastMessage: { content: string; createdAt: string; fromMe: boolean };
  unreadCount: number;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  mine: boolean;
}

export interface MessageReplyPreview {
  id: string;
  content: string;
  senderId: string;
}

export interface MessageFilmPreview {
  id: string;
  titre: string;
  affiche: string | null;
  annee: number | null;
  imdbNote: number | null;
  tmdbNote: number | null;
  genres: string[];
}

export interface MessageItem {
  id: string;
  content: string;
  senderId: string;
  lu: boolean;
  edited: boolean;
  editedAt: string | null;
  deleted: boolean;
  pinned: boolean;
  createdAt: string;
  replyTo: MessageReplyPreview | null;
  film: MessageFilmPreview | null;
  reactions: MessageReaction[];
}

export interface MessageThread {
  partner: { id: string; pseudo: string; nom: string | null; avatar: string | null };
  messages: MessageItem[];
  pinned: MessageItem | null;
}

// ── Users / Social API ────────────────────────────────────

export const socialApi = {
  searchUsers: (q: string) =>
    authFetch<UserSearch[]>(`/api/users/search?q=${encodeURIComponent(q)}`),

  getPublicProfil: (pseudo: string) =>
    authFetch<PublicProfil>(`/api/profils/${encodeURIComponent(pseudo)}`),

  follow: (pseudo: string) =>
    authFetch<{ ok: boolean }>(`/api/profils/${encodeURIComponent(pseudo)}/follow`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  unfollow: (pseudo: string) =>
    authFetch<{ ok: boolean }>(`/api/profils/${encodeURIComponent(pseudo)}/follow`, {
      method: "DELETE",
      body: JSON.stringify({}),
    }),

  isFollowing: (pseudo: string) =>
    authFetch<{ following: boolean }>(`/api/profils/${encodeURIComponent(pseudo)}/is-following`),

  getFollowers: (pseudo: string) =>
    authFetch<UserSearch[]>(`/api/profils/${encodeURIComponent(pseudo)}/followers`),

  getFollowing: (pseudo: string) =>
    authFetch<UserSearch[]>(`/api/profils/${encodeURIComponent(pseudo)}/following`),
};

// ── Messages API ──────────────────────────────────────────

export const messagesApi = {
  getConversations: () => authFetch<MessageConversation[]>("/api/messages"),
  getThread: (pseudo: string) => authFetch<MessageThread>(`/api/messages/${encodeURIComponent(pseudo)}`),
  send: (pseudo: string, content: string, replyToId?: string, filmId?: string) =>
    authFetch<{ id: string; content: string; senderId: string; createdAt: string }>(`/api/messages/${encodeURIComponent(pseudo)}`, {
      method: "POST",
      body: JSON.stringify({ content, ...(replyToId ? { replyToId } : {}), ...(filmId ? { filmId } : {}) }),
    }),
  react: (messageId: string, emoji: string) =>
    authFetch<{ ok: boolean; action: "added" | "removed" }>(`/api/messages/react/${messageId}`, {
      method: "POST",
      body: JSON.stringify({ emoji }),
    }),
  deleteMessage: (messageId: string) =>
    authFetch<{ ok: boolean }>(`/api/messages/${messageId}`, { method: "DELETE" }),
  editMessage: (messageId: string, content: string) =>
    authFetch<{ id: string; content: string; edited: boolean }>(`/api/messages/${messageId}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    }),
  pinMessage: (pseudo: string, messageId: string) =>
    authFetch<{ ok: boolean; pinned: boolean }>(`/api/messages/${encodeURIComponent(pseudo)}/pin/${messageId}`, {
      method: "POST",
    }),
  unreadCount: () => authFetch<{ count: number }>("/api/messages/unread-count"),
};

// ── Helpers formatage ─────────────────────────────────────

export function formatDuree(minutes: number | null): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

export function formatHeure(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPrix(prix: number | null): string {
  if (!prix) return "";
  return prix.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}
