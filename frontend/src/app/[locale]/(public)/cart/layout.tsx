import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '购物车 - 淘课网',
  description: '管理您的培训课程购物车，一键结算采购企业培训课程。',
  keywords: '培训课程购物车, 企业培训采购',
  robots: { index: false, follow: false },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
