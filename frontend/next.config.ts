import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  output: 'standalone' as const,
  reactCompiler: true,
  transpilePackages: ['video.js'],
  async rewrites() {
    return [
      {
        source: '/taoke-legacy/:path*',
        destination: 'https://www.taoke.com/:path*',
      },
      {
        source: '/pxb-legacy/:path*',
        destination: 'https://www.91pxb.com/:path*',
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https' as const, hostname: 'images.unsplash.com' },
      { protocol: 'https' as const, hostname: 'ui-avatars.com' },
      { protocol: 'http' as const, hostname: 'localhost', port: '8080', pathname: '/**' },
      { protocol: 'http' as const, hostname: '10.0.14.20', port: '8080', pathname: '/**' },
      { protocol: 'https' as const, hostname: 'v2.taoke.com', pathname: '/**' },
      { protocol: 'https' as const, hostname: 'www.taoke.com', pathname: '/**' },
      { protocol: 'https' as const, hostname: 'taoke.com', pathname: '/**' },
      { protocol: 'https' as const, hostname: 'cdn-static.taoke.com', pathname: '/**' },
      { protocol: 'https' as const, hostname: 'cdn5-pxb-videos.taoke.com', pathname: '/**' },
      // 老库录播课封面常见域名（迁移数据）
      { protocol: 'https' as const, hostname: 'www.91pxb.com', pathname: '/**' },
      { protocol: 'http' as const, hostname: 'www.91pxb.com', pathname: '/**' },
      { protocol: 'https' as const, hostname: 'meethr.91pxb.com', pathname: '/**' },
      { protocol: 'https' as const, hostname: 'preview.kuanxue.com', pathname: '/**' },
      { protocol: 'https' as const, hostname: 'ws1.witsharer.com', pathname: '/**' },
      { protocol: 'https' as const, hostname: 'kuanxue-fsm.oss-cn-hangzhou.aliyuncs.com', pathname: '/**' },
      { protocol: 'https' as const, hostname: 'osscdn-training.ihr360.com', pathname: '/**' },
    ],
  },
};

export default withNextIntl(nextConfig);
