import type { Metadata } from "next";
import AlertesClient from "./AlertesClient";

export const metadata: Metadata = {
  title: "Mes alertes — CinéRadar",
};

export default function AlertesPage() {
  return <AlertesClient />;
}
