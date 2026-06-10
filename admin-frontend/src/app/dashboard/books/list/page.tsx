import PageContainer from '@/components/layout/page-container';

export const metadata = {
  title: '著作列表'
};

export default function Page() {
  return (
    <PageContainer
      scrollable={false}
      pageTitle='著作列表'
      pageDescription='查看和管理平台所有著作信息'
    >
      <div className='text-muted-foreground flex flex-1 items-center justify-center py-20 text-sm'>
        暂无数据
      </div>
    </PageContainer>
  );
}
