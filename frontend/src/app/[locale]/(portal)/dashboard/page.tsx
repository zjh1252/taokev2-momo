import { getTranslations } from 'next-intl/server';

export default async function DashboardPage() {
  const t = await getTranslations('user');

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
      {/* TODO: 仪表盘内容 */}
    </div>
  );
}
