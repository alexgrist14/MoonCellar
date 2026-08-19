import { Layout } from "../lib/app/ui/Layout";
import localFont from "next/font/local";
import classNames from "classnames";
import { ReactNode } from "react";
import { polyfill } from "interweave-ssr";
import { Metadata } from "next";
import { FaroInit } from "../lib/shared/ui/FaroInit";
import { FaroRouteTracker } from "../lib/shared/ui/FaroRouteTracker";
import { GeoInit } from "../lib/shared/ui/GeoInit";
import "@/src/lib/app/styles/reset.scss";
import "@/src/lib/app/styles/root.scss";
import { QueryProvider } from "../lib/app/providers/QueryProvider";

export const metadata: Metadata = {
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
      </head>
      <body style={{ color: "white", background: "#191d24" }}>
        <QueryProvider>
          <FaroInit />
          <GeoInit />
          <FaroRouteTracker />
          <Layout className={classNames(general.variable, pentagra.variable)}>
            {children}
          </Layout>
        </QueryProvider>
      </body>
    </html>
  );
}
