import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080').replace(
  /\/$/,
  '',
);

const nextConfig = {
  output: 'standalone' as const,
  reactCompiler: true,
  transpilePackages: ['video.js'],
  async rewrites() {
    return [
      {
        source: '/favicon.ico',
        destination: '/statics/images/taoke-new-logo.jpg',
      },
      {
        source: '/taoke-legacy/:path*',
        destination: 'https://www.taoke.com/:path*',
      },
      {
        source: '/pxb-legacy/:path*',
        destination: 'https://www.91pxb.com/:path*',
      },
      /** 本地 dev：后端上传文件（头像等） */
      {
        source: '/uploads/:path*',
        destination: `${apiBase}/uploads/:path*`,
      },
      /** PXB 录播反代见 src/app/pxb-videos/[...path]/route.ts（rewrite 会透传 Referer 导致 CDN 403） */
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https' as const, hostname: 'images.unsplash.com' },
      { protocol: 'https' as const, hostname: 'ui-avatars.com' },
      { protocol: 'http' as const, hostname: 'localhost', port: '8080', pathname: '/**' },
      { protocol: 'http' as const, hostname: 'localhost', port: '3000', pathname: '/**' },
      { protocol: 'http' as const, hostname: 'localhost', port: '18080', pathname: '/**' },
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
