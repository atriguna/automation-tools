/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "backend-automation-production-badd.up.railway.app",
        pathname: "/screenshots/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3004",
        pathname: "/screenshots/**",
      },
    ],
  },
};

module.exports = nextConfig;
