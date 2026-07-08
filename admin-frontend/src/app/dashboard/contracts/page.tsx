import PageContainer from '@/components/layout/page-container';
import { Icons } from '@/components/icons';

export const metadata = {
  title: '合约管理'
};

/**
 * 合约管理占位页
 *
 * @author Fangxinxin
 * @date 2026-07-07 00:00
 */
export default function ContractsPage() {
  return (
    <PageContainer pageTitle='合约管理' pageDescription='培训服务合约、合作协议与签署记录管理'>
      <div className='border-border bg-background flex min-h-[320px] items-center justify-center rounded-lg border'>
        <div className='flex max-w-sm flex-col items-center gap-3 text-center'>
          <Icons.contract className='text-muted-foreground size-10' />
          <div className='text-lg font-semibold'>功能建设中</div>
          <p className='text-muted-foreground text-sm'>
            合约管理页面已预留，后续接入合约列表与审批流程后可在此处理。
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
