import { AuthLayoutWrapper } from '@/components/layout/auth-layout-wrapper';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayoutWrapper>{children}</AuthLayoutWrapper>;
}
