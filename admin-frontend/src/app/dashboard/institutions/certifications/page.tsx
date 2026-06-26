import PageContainer from '@/components/layout/page-container';

export const metadata = {
  title: '机构资质认证'
};

export default function Page() {
  return (
    <PageContainer
      scrollable={false}
      pageTitle='资质认证'
      pageDescription='审核机构提交的资质认证申请'
    >
      <div className='text-muted-foreground flex flex-1 items-center justify-center py-20 text-sm'>
        暂无数据
      </div>
    </PageContainer>
  );
}
