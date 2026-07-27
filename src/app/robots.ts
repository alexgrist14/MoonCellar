import { MetadataRoute } from "next";
import { FRONT_URL } from "../lib/shared/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: `${FRONT_URL}/sitemap.xml`,
  };
}
