/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  sassOptions: {
    additionalData: '@use "@/src/lib/app/styles/index.scss" as *;',
  },
  images: {
    remotePatterns: [
      // {
      //   protocol: "https",
      //   hostname: "images.igdb.com",
      // },
      // {
      //   protocol: "https",
      //   hostname: "images7.alphacoders.com",
      // },
      // {
      //   protocol: "http",
      //   hostname: "localhost",
      //   port: "3228",
      // },
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
    ],
  },
};

export default nextConfig;
