import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

const namespaces = ['common', 'nav', 'auth', 'course', 'user', 'home', 'trainer', 'video', 'cart', 'order', 'search'];

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  const loadMessages = async (loc: string) => {
    const results = await Promise.all(
      namespaces.map((ns) =>
        import(`../messages/${loc}/${ns}.json`)
          .then((m) => [ns, m.default] as const)
          .catch(() => [ns, {}] as const),
      ),
    );
    return Object.fromEntries(results);
  };

  const messages = await loadMessages(locale);

  return { locale, messages };
});
