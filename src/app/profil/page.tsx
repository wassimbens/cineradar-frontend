import type { Metadata } from "next";
import ProfilClient from "./ProfilClient";

export const metadata: Metadata = {
  title: "Mon Profil — CinéRadar",
  description: "Vos films favoris, watchlist, cinémas préférés et avis sur CinéRadar.",
};

export default function ProfilPage() {
  return <ProfilClient />;
}
