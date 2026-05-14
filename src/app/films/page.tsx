import type { Metadata } from "next";
import FilmCatalog from "./FilmCatalog";

export const metadata: Metadata = {
  title: "Catalogue films — CinéRadar",
  description: "Tous les films disponibles sur CinéRadar — actuels et classiques.",
};

export default function FilmsPage() {
  return <FilmCatalog />;
}
