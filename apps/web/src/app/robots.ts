import { MetadataRoute } from "next";
import { FRONT_URL } from "@/src/lib/shared/constants";

// Filter combinations on /games and request forms link to each other
// endlessly and let crawlers reach the whole catalog.
const disallow = ["/admin", "/api", "/games?", "/requests"];

// Crawlers that hammered /games and /_next/image hard enough to fill the
// server disk with ISR and image caches.
const aggressiveBots = [
  "ClaudeBot",
  "Applebot",
  "Amazonbot",
  "Reflectionbot",
  "meta-externalagent",
  "ExaSearchBot",
  "PetalBot",
  "SemrushBot",
  "AhrefsBot",
  "SERankingBacklinksBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
      {
        userAgent: aggressiveBots,
        allow: "/",
        disallow: [...disallow, "/_next/image"],
        crawlDelay: 2,
      },
    ],
    sitemap: `${FRONT_URL}/sitemap.xml`,
  };
}
