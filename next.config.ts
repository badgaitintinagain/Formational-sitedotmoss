import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'gsap'],
    // Use web version of @libsql/client for ARM64 compatibility
    turbo: {
      resolveAlias: {
        '@libsql/client': '@libsql/client/web',
      },
    },
  },
};

export default nextConfig;
