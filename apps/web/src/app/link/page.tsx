import { Metadata } from "next";
import { Suspense } from "react";
import { GameLinkPage } from "@/src/lib/pages/GameLinkPage";
import { PageSkeleton } from "@/src/lib/shared/ui/PageSkeleton";

export const metadata: Metadata = {
  title: "Link a game",
  description: "Sign a game in with your MoonCellar account",
  robots: { index: false, follow: false },
};

const LinkRoute = () => (
  <Suspense fallback={<PageSkeleton />}>
    <GameLinkPage />
  </Suspense>
);

export default LinkRoute;
