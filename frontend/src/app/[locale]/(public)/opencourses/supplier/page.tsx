import { PxbDemandFormSection } from '@/features/demand/components/pxb/PxbDemandFormSection';
import { getCachedTrainerExpertiseTree } from '@/lib/cached-categories';
import { isPxbEmbedOrigin } from '@/lib/pxb-embed';

interface Props {
  searchParams: Promise<{ origin?: string }>;
}

export async function generateMetadata({ searchParams }: Props) {
  const sp = await searchParams;
  if (isPxbEmbedOrigin(sp.origin)) {
    return { title: '发布外派培训需求' };
  }
  return { title: '发布公开课需求' };
}

export default async function OpenCourseSupplierPage({ searchParams }: Props) {
  const sp = await searchParams;
  const expertiseTree = await getCachedTrainerExpertiseTree();

  if (!isPxbEmbedOrigin(sp.origin)) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-gray-600">请从培训宝入口访问本页，或携带参数 origin=91pxb。</p>
      </main>
    );
  }

  return <PxbDemandFormSection kind="OPEN" expertiseTree={expertiseTree} />;
}
