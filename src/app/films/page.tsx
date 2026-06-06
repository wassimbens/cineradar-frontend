import type { Metadata } from "next";
import FilmCatalog from "./FilmCatalog";

export const revalidate = 3600; // 1h — contenu qui change régulièrement

export const metadata: Metadata = {
  title: "Catalogue films — CinéRadar",
  description: "Tous les films disponibles sur CinéRadar — actuels et classiques.",
};

export default function FilmsPage() {
  return <FilmCatalog />;
}
