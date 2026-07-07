import PageContainer from '@/components/layout/page-container';

export const metadata = {
  title: '机构员工资质认证'
};

export default function Page() {
  return (
    <PageContainer
      scrollable={false}
      pageTitle='工作认证'
      pageDescription='审核机构员工提交的工作认证申请'
    >
      <div className='text-muted-foreground flex flex-1 items-center justify-center py-20 text-sm'>
        暂无数据
      </div>
    </PageContainer>
  );
}
