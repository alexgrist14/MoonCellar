import { GamesPage } from "@/src/lib/pages/GamesPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Games",
  description: "Search games with various filters",
  keywords: [
    "game search",
    "games search",
    "game filters",
    "games filters",
    "game list",
    "games list",
    "video games",
  ],
};

const GamesPageIndex = () => {
  return <GamesPage />;
};

export default GamesPageIndex;
