/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  sassOptions: {
    additionalData: '@import "./src/lib/shared/styles/app.scss"; ',
  },
};

export default nextConfig;
