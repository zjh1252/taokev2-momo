import { getTranslations } from 'next-intl/server';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export async function generateMetadata() {
  const t = await getTranslations('auth');
  return { title: t('register.title') };
}

export default function RegisterPage() {
  return <RegisterForm />;
}
