import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { siteConfig } from '@/config/site';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Providers } from './providers';
import '@/styles/globals.css';

export async function generateMetadata() {
  return {
    metadataBase: new URL(siteConfig.url),
    title: siteConfig.title,
    description: siteConfig.description,
    keywords: siteConfig.keywords,
    // 浏览器侧边栏/标签页 favicon 使用淘课 logo
    icons: {
      icon: '/statics/images/taoke-new-logo.jpg',
      shortcut: '/statics/images/taoke-new-logo.jpg',
      apple: '/statics/images/taoke-new-logo.jpg',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full max-w-full overflow-x-clip antialiased">
      <body className="flex min-h-full max-w-full flex-col overflow-x-clip font-sans">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
