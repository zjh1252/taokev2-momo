import PageContainer from '@/components/layout/page-container';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: '专家助理资质认证'
};

export default function Page() {
  return (
    <PageContainer
      scrollable={false}
      pageTitle='资质认证'
      pageDescription='专家助理入驻资料审核'
    >
      <div className='flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center'>
        <p className='text-muted-foreground max-w-md text-sm'>
          专家助理提交入驻申请后由系统自动审核通过，无需单独资质认证流程。请在「助理列表」中查看与管理助理资料。
        </p>
        <Button asChild variant='outline'>
          <Link href='/dashboard/assistants'>前往助理列表</Link>
        </Button>
      </div>
    </PageContainer>
  );
}
