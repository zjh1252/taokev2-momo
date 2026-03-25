import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  const loadMessages = async (loc: string) => {
    const [common, nav, auth, course, user] = await Promise.all([
      import(`../messages/${loc}/common.json`).then(m => m.default).catch(() => ({})),
      import(`../messages/${loc}/nav.json`).then(m => m.default).catch(() => ({})),
      import(`../messages/${loc}/auth.json`).then(m => m.default).catch(() => ({})),
      import(`../messages/${loc}/course.json`).then(m => m.default).catch(() => ({})),
      import(`../messages/${loc}/user.json`).then(m => m.default).catch(() => ({})),
    ]);
    return { common, nav, auth, course, user };
  };

  const messages = await loadMessages(locale);

  return { locale, messages };
});
