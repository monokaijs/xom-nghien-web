import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(process.cwd(), '../..'),
  transpilePackages: ['@xom/db', '@xom/game-config', '@xom/queue'],
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
