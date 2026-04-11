import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.cstrike.app',
      },
      {
        protocol: 'https',
        hostname: 'avatars.steamstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'images.gamebanana.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.xomnghien.com',
      },
      {
        protocol: 'https',
        hostname: '**.fitgirl-repacks.site',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      {
        protocol: 'https',
        hostname: '**.wp.com',
      },
    ],
  },
};

export default nextConfig;
