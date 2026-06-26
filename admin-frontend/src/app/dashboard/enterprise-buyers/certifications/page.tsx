import PageContainer from '@/components/layout/page-container';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: '企业采购方资质认证'
};

export default function Page() {
  return (
    <PageContainer
      scrollable={false}
      pageTitle='资质认证'
      pageDescription='企业采购方入驻资料审核'
    >
      <div className='flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center'>
        <p className='text-muted-foreground max-w-md text-sm'>
          企业采购方提交入驻申请后由系统自动审核通过，无需单独资质认证流程。请在「采购方列表」中查看与管理企业资料。
        </p>
        <Button asChild variant='outline'>
          <Link href='/dashboard/enterprise-buyers'>前往采购方列表</Link>
        </Button>
      </div>
    </PageContainer>
  );
}
