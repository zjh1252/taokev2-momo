import PageContainer from '@/components/layout/page-container';
import { CategoryTreeTable } from '@/features/categories/components/category-tree-table';
import { CATEGORY_TYPE_MAP, CATEGORY_TYPE_LABELS } from '@/features/categories/api/types';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ type: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { type: slug } = await params;
  const backendType = CATEGORY_TYPE_MAP[slug];
  const label = backendType ? CATEGORY_TYPE_LABELS[backendType] : null;
  return { title: label ? `${label} - 分类管理` : '分类管理' };
}

export default async function CategoryPage({ params }: Props) {
  const { type: slug } = await params;
  const backendType = CATEGORY_TYPE_MAP[slug];

  if (!backendType) {
    notFound();
  }

  const label = CATEGORY_TYPE_LABELS[backendType] ?? backendType;

  return (
    <PageContainer
      scrollable
      pageTitle={label}
      pageDescription={`管理${label}分类（树形结构）`}
    >
      <CategoryTreeTable categoryType={backendType} />
    </PageContainer>
  );
}
