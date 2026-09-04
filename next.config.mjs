import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  turbopack: {
    root: projectRoot,
  },
  sassOptions: {
    loadPaths: [join(projectRoot, "src/lib/app/styles")],
    additionalData: '@use "@/src/lib/app/styles/index.scss" as *;',
  },
  async headers() {
    return [
      {
        source: "/_next/static/media/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.igdb.com",
      },
      {
        protocol: "https",
        hostname: "images7.alphacoders.com",
      },
      {
        protocol: "https",
        hostname: "static.retroachievements.org",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3228",
      },
      {
        protocol: "https",
        hostname: "api.mooncellar.space",
      },
      {
        protocol: "https",
        hostname: "media.retroachievements.org",
      },
      {
        protocol: "https",
        hostname: "mooncellar-*.s3.regru.cloud",
      },
      {
        protocol: "https",
        hostname: "s3.regru.cloud",
      },
      {
        protocol: "https",
        hostname: "*.sfo3.cdn.digitaloceanspaces.com",
      },
      {
        protocol: "https",
        hostname: "*.sfo3.digitaloceanspaces.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },
};

export default nextConfig;
