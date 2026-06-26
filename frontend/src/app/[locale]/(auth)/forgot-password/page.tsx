import { getTranslations } from 'next-intl/server';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

export async function generateMetadata() {
  const t = await getTranslations('auth');
  return { title: t('forgot.title') };
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
