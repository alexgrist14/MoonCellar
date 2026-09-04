import { Layout } from "../lib/app/ui/Layout";
import localFont from "next/font/local";
import classNames from "classnames";
import { ReactNode, Suspense } from "react";
import { polyfill } from "interweave-ssr";
import { Metadata } from "next";
import { FaroInit } from "../lib/shared/ui/FaroInit";
import { FaroRouteTracker } from "../lib/shared/ui/FaroRouteTracker";
import { GeoInit } from "../lib/shared/ui/GeoInit";
import { NavigationProgress } from "../lib/shared/ui/NavigationProgress";
import "@/src/lib/app/styles/reset.scss";
import "@/src/lib/app/styles/root.scss";
import { QueryProvider } from "../lib/app/providers/QueryProvider";
import { FRONT_URL } from "../lib/shared/constants";
import { JsonLd } from "../lib/shared/ui/JsonLd";
import { getWebSiteJsonLd } from "../lib/shared/utils/json-ld.utils";

export const metadata: Metadata = {
  metadataBase: new URL(FRONT_URL),
  title: {
    default: "MoonCellar — Game Tracker & Database",
    template: "%s | MoonCellar",
  },
  description:
    "Track your game library, rate and review titles, unlock achievements, and find your next game with the Gauntlet — all in one place on MoonCellar.",
  keywords: [
    "game tracker",
    "games tracker",
    "game database",
    "games database",
    "game backlog",
    "games backlog",
    "game reviews",
    "games reviews",
    "achievements",
  ],
  openGraph: {
    siteName: "MoonCellar",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/images/og-default.png",
        width: 1200,
        height: 630,
        alt: "MoonCellar — game tracker and backlog database",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

const general = localFont({
  variable: "--font-general",
  src: [
    {
      path: "./ApercuPro.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./ApercuPro-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./ApercuPro-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
});

const pentagra = localFont({
  variable: "--font-pentagra",
  src: [
    {
      path: "./Pentagra.ttf",
      weight: "400",
      style: "normal",
    },
  ],
});
polyfill();

export default function App({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/favicon.ico" type="image/x-icon" />
        <JsonLd data={getWebSiteJsonLd()} />
      </head>
      <body style={{ color: "white", background: "#191d24" }}>
        <QueryProvider>
          <FaroInit />
          <GeoInit />
          <FaroRouteTracker />
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          <Layout className={classNames(general.variable, pentagra.variable)}>
            {children}
          </Layout>
        </QueryProvider>
      </body>
    </html>
  );
}
