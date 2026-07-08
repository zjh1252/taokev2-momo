import PageContainer from '@/components/layout/page-container';
import { Icons } from '@/components/icons';

export const metadata = {
  title: '系统设置'
};

/**
 * 系统设置占位页
 *
 * @author Fangxinxin
 * @date 2026-07-07 00:00
 */
export default function SettingsPage() {
  return (
    <PageContainer pageTitle='系统设置' pageDescription='平台基础配置与后台运行参数维护'>
      <div className='border-border bg-background flex min-h-[320px] items-center justify-center rounded-lg border'>
        <div className='flex max-w-sm flex-col items-center gap-3 text-center'>
          <Icons.settings className='text-muted-foreground size-10' />
          <div className='text-lg font-semibold'>功能建设中</div>
          <p className='text-muted-foreground text-sm'>
            系统设置页面已预留，后续接入配置项后可在此维护。
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
