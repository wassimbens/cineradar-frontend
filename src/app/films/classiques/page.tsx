import type { Metadata } from "next";
import ClassiquesCatalog from "./ClassiquesCatalog";
import { api } from "@/lib/api";

export const metadata: Metadata = {
  title: "Classiques du cinéma — CinéRadar",
  description:
    "Les grands classiques du cinéma à revoir en salle : Kubrick, Hitchcock, Godard, Tati et bien d'autres. Organisés par réalisateur et par époque.",
  openGraph: {
    title: "Classiques du cinéma — CinéRadar",
    description: "Les grands classiques à revoir en salle, organisés par réalisateur et époque.",
    type: "website",
  },
};

export const revalidate = 7200; // 2h

export default async function ClassiquesPage() {
  const films = await api.getAllClassicFilms().catch(() => []);
  return <ClassiquesCatalog films={films} />;
}
