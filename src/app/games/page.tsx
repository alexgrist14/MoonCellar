import { GamesPage } from "@/src/lib/pages/GamesPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Games",
  description: "Search games with various filters",
};

const GamesPageIndex = () => {
  return <GamesPage />;
};

export default GamesPageIndex;
