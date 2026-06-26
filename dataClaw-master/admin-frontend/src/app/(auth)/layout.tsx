import type { Metadata } from 'next';
import { AuthOwlProvider } from './auth-owl-context';
import { InteractiveOwl } from './interactive-owl';

export const metadata: Metadata = {
  title: '淘课网管理后台 - 登录'
};

export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthOwlProvider>
      <div className='flex min-h-screen'>
        {/* 左侧品牌区 */}
        <div className='hidden w-1/2 flex-col items-center justify-center bg-gradient-to-br from-[#075e54] to-[#128c7e] p-12 lg:flex'>
          <div className='max-w-md text-center text-white'>
            <h1 className='mb-4 text-4xl font-bold tracking-tight'>淘课网</h1>
            <p className='text-primary-foreground/80 text-lg'>
              企业培训采购一站式管理平台
            </p>
            <div className='mt-12 flex justify-center'>
              <InteractiveOwl />
            </div>
            <p className='text-primary-foreground/60 mt-8 text-sm'>
              高效管理 · 智能匹配 · 数据驱动
            </p>
          </div>
        </div>

        {/* 右侧表单区 */}
        <div className='bg-background flex w-full flex-col items-center justify-center p-6 lg:w-1/2'>
          <div className='w-full max-w-[420px]'>
            <div className='mb-8 text-center lg:hidden'>
              <h1 className='text-primary text-2xl font-bold'>淘课网</h1>
              <p className='text-muted-foreground text-sm'>
                企业培训采购一站式管理平台
              </p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </AuthOwlProvider>
  );
}
