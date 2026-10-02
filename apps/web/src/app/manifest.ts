import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "MoonCellar",
    short_name: "MoonCellar",
    description:
      "Track your game library, rate and review titles, unlock achievements, and find your next game with the Gauntlet.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#191d24",
    theme_color: "#191d24",
    categories: ["entertainment", "games"],
    icons: [
      { src: "/images/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/images/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/images/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Games", url: "/games", icons: [{ src: "/images/icon-192.png", sizes: "192x192" }] },
      {
        name: "Gauntlet",
        url: "/gauntlet",
        icons: [{ src: "/images/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Notifications",
        url: "/notifications",
        icons: [{ src: "/images/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
