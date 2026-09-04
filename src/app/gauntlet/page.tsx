import { GauntletPage } from "@/src/lib/pages/GauntletPage/GauntletPage";
import { Metadata } from "next";
import { Suspense } from "react";
import styles from "@/src/lib/pages/GauntletPage/GauntletPage.module.scss";
import { GauntletHeader } from "@/src/lib/pages/GauntletPage/GauntletHeader";
import { PageLoader } from "@/src/lib/shared/ui/PageLoader";
import { JsonLd } from "@/src/lib/shared/ui/JsonLd";
import { getBreadcrumbJsonLd } from "@/src/lib/shared/utils/json-ld.utils";

export const metadata: Metadata = {
  title: "Gauntlet",
  description: "Spin the wheel and find your new favorite game",
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
    <div className={styles.wrapper}>
      <JsonLd
        data={getBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Gauntlet", path: "/gauntlet" },
        ])}
      />
      <GauntletHeader />
      <Suspense fallback={<PageLoader />}>
        <GauntletPage />
      </Suspense>
    </div>
  );
};

export default GauntletPageIndex;
