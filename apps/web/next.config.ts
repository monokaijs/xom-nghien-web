import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(process.cwd(), '../..'),
  transpilePackages: ['@xom/db', '@xom/game-config', '@xom/queue'],
  async redirects() {
    return [
      {
        source: '/admin/game-servers',
        destination: '/admin/cs2-servers',
        permanent: false,
      },
      {
        source: '/admin/game-configurations',
        destination: '/admin/cs2-servers?tab=configurations',
        permanent: false,
      },
      {
        source: '/admin/server-hosts',
        destination: '/admin/cs2-servers?tab=hosts',
        permanent: false,
      },
      {
        source: '/admin/game-credentials',
        destination: '/admin/cs2-servers?tab=credentials',
        permanent: false,
      },
      {
        source: '/admin/rcon',
        destination: '/admin/cs2-servers',
        permanent: false,
      },
    ];
  },
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
