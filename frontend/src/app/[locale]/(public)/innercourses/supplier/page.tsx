import { PxbDemandFormSection } from '@/features/demand/components/pxb/PxbDemandFormSection';
import { getTrainerDetail } from '@/features/trainer/api/service';
import { getTrainerDisplayName } from '@/features/trainer/utils/displayName';
import { getCachedTrainerExpertiseTree } from '@/lib/cached-categories';
import { isPxbEmbedOrigin } from '@/lib/pxb-embed';

interface Props {
  searchParams: Promise<{ origin?: string; trainer_id?: string }>;
}

export async function generateMetadata({ searchParams }: Props) {
  const sp = await searchParams;
  if (isPxbEmbedOrigin(sp.origin)) {
    return { title: '发布外请内训需求' };
  }
  return { title: '发布内训课需求' };
}

export default async function InnerCourseSupplierPage({ searchParams }: Props) {
  const sp = await searchParams;
  const expertiseTree = await getCachedTrainerExpertiseTree();

  if (!isPxbEmbedOrigin(sp.origin)) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-gray-600">请从培训宝入口访问本页，或携带参数 origin=91pxb。</p>
      </main>
    );
  }

  const trainerId = sp.trainer_id ? Number(sp.trainer_id) : undefined;
  let trainerName: string | undefined;
  if (trainerId && Number.isFinite(trainerId)) {
    try {
      const trainer = await getTrainerDetail(trainerId);
      trainerName = getTrainerDisplayName(trainer);
    } catch {
      trainerName = undefined;
    }
  }

  return (
    <PxbDemandFormSection
      kind="INTERNAL"
      expertiseTree={expertiseTree}
      trainerId={trainerId}
      trainerName={trainerName}
    />
  );
}
