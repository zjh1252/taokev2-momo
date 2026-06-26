import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
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
      }
    ]
  },
  transpilePackages: ['geist'],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
};

export default nextConfig;
