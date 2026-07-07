// import { dirname } from "node:path";
// import { fileURLToPath } from "node:url";

// const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // outputFileTracingRoot: projectRoot,
  reactStrictMode: false,
  sassOptions: {
    additionalData: '@use "@/src/lib/app/styles/index.scss" as *;',
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
        hostname: "*.sfo3.cdn.digitaloceanspaces.com",
      },
      {
        protocol: "https",
        hostname: "*.sfo3.digitaloceanspaces.com",
      },
    ],
  },
};

export default nextConfig;
