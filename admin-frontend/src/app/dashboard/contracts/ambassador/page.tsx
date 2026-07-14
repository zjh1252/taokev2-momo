import PageContainer from '@/components/layout/page-container';
import { Icons } from '@/components/icons';

export const metadata = {
  title: '推广大使'
};

/**
 * 推广大使合约占位页
 *
 * @author Fangxinxin
 * @date 2026-07-14 09:45
 */
export default function AmbassadorContractsPage() {
  return (
    <PageContainer pageTitle='推广大使' pageDescription='推广大使合约与入驻申请管理'>
      <div className='border-border bg-background flex min-h-[320px] items-center justify-center rounded-lg border'>
        <div className='flex max-w-sm flex-col items-center gap-3 text-center'>
          <Icons.contract className='text-muted-foreground size-10' />
          <div className='text-lg font-semibold'>功能建设中</div>
          <p className='text-muted-foreground text-sm'>
            推广大使合约页面已预留，后续接入协议与审核流程后可在此处理。
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
