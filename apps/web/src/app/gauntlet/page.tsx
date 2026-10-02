import { GauntletPage } from "@/src/lib/pages/GauntletPage";
import { Metadata } from "next";
import { JsonLd } from "@/src/lib/shared/ui/JsonLd";
import { getBreadcrumbJsonLd } from "@/src/lib/shared/utils/json-ld.utils";

export const metadata: Metadata = {
  title: "Gauntlet",
  description: "Spin the wheel and find your new favourite game",
  keywords: [
    "game picker",
    "games picker",
    "random game",
    "random games",
    "game roulette",
    "games roulette",
    "find a game",
  ],
  alternates: {
    canonical: "/gauntlet",
  },
};

const GauntletPageIndex = () => {
  return (
    <>
      <JsonLd
        data={getBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Gauntlet", path: "/gauntlet" },
        ])}
      />
      <GauntletPage />
    </>
  );
};

export default GauntletPageIndex;
