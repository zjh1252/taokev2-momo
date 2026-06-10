import PageContainer from '@/components/layout/page-container';

export const metadata = {
  title: '推荐专家'
};

export default function Page() {
  return (
    <PageContainer
      scrollable={false}
      pageTitle='推荐专家'
      pageDescription='管理平台推荐的专家列表，控制首页展示顺序'
    >
      <div className='text-muted-foreground flex flex-1 items-center justify-center py-20 text-sm'>
        暂无数据
      </div>
    </PageContainer>
  );
}
