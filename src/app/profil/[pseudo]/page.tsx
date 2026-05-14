import type { Metadata } from "next";
import PublicProfilClient from "./PublicProfilClient";

type Props = { params: Promise<{ pseudo: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pseudo } = await params;
  return {
    title: `@${pseudo} — CinéRadar`,
    description: `Découvrez le profil de @${pseudo} sur CinéRadar : films vus, watchlist, avis et favoris.`,
    openGraph: {
      title: `@${pseudo} sur CinéRadar`,
      description: `Profil cinéphile de @${pseudo} : films vus, avis et watchlist.`,
      type: "profile",
    },
  };
}

export default async function PublicProfilPage({ params }: Props) {
  const { pseudo } = await params;
  return <PublicProfilClient pseudo={pseudo} />;
}
