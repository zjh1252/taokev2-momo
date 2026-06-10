import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { LegacyRichText } from '@/components/legacy-rich-text';
import { SafeImage } from '@/components/safe-image';
import type { TrainerCase } from '../api/types';

interface CaseDetailViewProps {
  caseData: TrainerCase;
  trainerName: string;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function CaseDetailView({ caseData, trainerName }: CaseDetailViewProps) {
  return (
    <article className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {caseData.coverImage && (
        <div className="relative h-56 md:h-72 w-full">
          <SafeImage
            src={caseData.coverImage}
            alt={caseData.caseTitle}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="p-6 md:p-8 space-y-8">
        <header>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
            {caseData.caseTitle}
          </h1>
          <p className="text-sm text-slate-500">
            服务讲师：
            <Link
              href={`/trainer/${caseData.trainerId}.htm`}
              className="text-primary hover:underline font-medium"
            >
              {trainerName}
            </Link>
          </p>
        </header>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
            案例信息
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-500">客户企业</dt>
              <dd className="font-medium text-slate-800 mt-1">{caseData.enterpriseName || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">所属行业</dt>
              <dd className="font-medium text-slate-800 mt-1">{caseData.industry || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">培训时间</dt>
              <dd className="font-medium text-slate-800 mt-1">{formatDate(caseData.trainingDate)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">培训地点</dt>
              <dd className="font-medium text-slate-800 mt-1">{caseData.trainingAddress || '—'}</dd>
            </div>
            {caseData.traineeCount != null && (
              <div>
                <dt className="text-slate-500">参训人数</dt>
                <dd className="font-medium text-slate-800 mt-1">{caseData.traineeCount} 人</dd>
              </div>
            )}
          </dl>
        </section>

        {caseData.trainingTopic && (
          <section>
            <h3 className="text-base font-bold text-slate-900 mb-3">培训主题</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {caseData.trainingTopic}
            </p>
          </section>
        )}

        {caseData.trainingEffect && (
          <section>
            <h3 className="text-base font-bold text-slate-900 mb-3">培训效果</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {caseData.trainingEffect}
            </p>
          </section>
        )}

        {caseData.description && (
          <section>
            <h3 className="text-base font-bold text-slate-900 mb-3">案例详情</h3>
            <LegacyRichText content={caseData.description} className="text-sm" />
          </section>
        )}

        {caseData.files.length > 0 && (
          <section>
            <h3 className="text-base font-bold text-slate-900 mb-4">案例图片</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {caseData.files.map((file) => (
                <div key={file.id} className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-100">
                  <Image
                    src={file.thumbnailUrl || file.fileUrl}
                    alt={file.title || caseData.caseTitle}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
