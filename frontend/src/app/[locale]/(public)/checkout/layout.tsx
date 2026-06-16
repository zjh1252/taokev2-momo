import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '确认订单信息 - 淘课网',
  description: '确认您的培训课程订单，选择支付方式完成企业培训采购。',
  keywords: '培训课程订单, 企业培训结算, 培训采购支付',
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
