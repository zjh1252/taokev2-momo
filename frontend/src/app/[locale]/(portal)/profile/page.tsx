import { getTranslations } from 'next-intl/server';

export default async function ProfilePage() {
  const t = await getTranslations('user');

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
      {/* TODO: 个人资料页 */}
    </div>
  );
}
