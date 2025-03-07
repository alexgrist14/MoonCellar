/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  sassOptions: {
    additionalData: '@import "./src/lib/shared/styles/app.scss"; ',
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.igdb.com",
      },
      {
        protocol:"http",
        hostname:"localhost",
        port: "3228",
      },
      {
        protocol: "https",
        hostname: "api.mooncellar.space"
      },
      {
        protocol: "https",
        hostname: "media.retroachievements.org"
      },
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '**',
    },
    ],
  },
};

export default nextConfig;
