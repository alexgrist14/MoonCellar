import { GamesPage } from "@/src/lib/pages/GamesPage";
import { Metadata } from "next";
import { Suspense } from "react";
import { Loader } from "@/src/lib/shared/ui/Loader";

export const metadata: Metadata = {
  title: "Games",
  description: "Search games with various filters",
};

const GamesPageIndex = () => {
  return (
    <Suspense fallback={<Loader type="moon" />}>
      <GamesPage />
    </Suspense>
  );
};

export default GamesPageIndex;
