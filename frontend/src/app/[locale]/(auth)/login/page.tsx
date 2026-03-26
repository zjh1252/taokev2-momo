import { getTranslations } from 'next-intl/server';
import { LoginForm } from '@/modules/auth/components/LoginForm';

export async function generateMetadata() {
  const t = await getTranslations('auth');
  return { title: t('login.title') };
}

export default function LoginPage() {
  return <LoginForm />;
}
