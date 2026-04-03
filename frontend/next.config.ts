import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https' as const, hostname: 'images.unsplash.com' },
      { protocol: 'https' as const, hostname: 'ui-avatars.com' },
    ],
  },
};

export default withNextIntl(nextConfig);
