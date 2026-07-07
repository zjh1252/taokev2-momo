import type { NextConfig } from 'next';

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080').replace(
  /\/+$/,
  ''
);
const frontendBase = (
  process.env.NEXT_PUBLIC_FRONTEND_BASE_URL || 'http://localhost:3000'
).replace(/\/+$/, '');

const nextConfig: NextConfig = {
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${apiBase}/uploads/:path*`
      },
      {
        source: '/statics/:path*',
        destination: `${frontendBase}/statics/:path*`
      },
      {
        source: '/taoke-legacy/:path*',
        destination: 'https://www.taoke.com/:path*'
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.slingacademy.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'clerk.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'www.taoke.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'taoke.com',
        port: ''
      },
      // 本地开发：C 端静态资源、后端直出 uploads
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000'
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080'
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000'
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8080'
      },
      {
        protocol: 'https',
        hostname: '**.aliyuncs.com'
      },
      {
        protocol: 'https',
        hostname: 'cdn-static.taoke.com'
      },
      {
        protocol: 'https',
        hostname: 'cdn5-pxb-videos.taoke.com'
      }
    ]
  },
  transpilePackages: ['geist'],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
};

export default nextConfig;
