import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { SafeImage } from '@/components/safe-image';
import { Link } from '@/i18n/navigation';
import { DEFAULT_COURSE_COVER } from '@/lib/media';
import { getApprovedCaseDetail } from '@/features/trainer/api/service';
import type { TrainerCase, TrainerCaseFile } from '@/features/trainer-case/api/types';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string; id: string; caseId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { caseId } = await params;
  try {
    const c = await getApprovedCaseDetail(Number(caseId));
    return { title: `${c.caseTitle} - 成功案例 - 淘课网` };
  } catch {
    return { title: '成功案例 - 淘课网' };
  }
}

/** 培训日期段展示：yyyy/mm/dd - yyyy/mm/dd */
function formatDateRange(start: string | null, end: string | null): string {
  const fmt = (d: string | null) => (d ? d.slice(0, 10).replace(/-/g, '/') : '');
  const s = fmt(start);
  const e = fmt(end);
  if (s && e) return `${s} - ${e}`;
  return s || e || '';
}

/** 地区名称拼接 */
function formatRegion(c: TrainerCase): string {
  return [c.provinceName, c.cityName, c.districtName, c.trainingAddress]
    .filter((x) => x && x.trim())
    .join(' ');
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <span className="w-24 shrink-0 text-sm text-slate-500">{label}</span>
      <span className="text-sm text-slate-800 flex-1 whitespace-pre-wrap">{value}</span>
    </div>
  );
}

/** 媒体附件：图片直接展示，视频用原生播放器 */
function CaseFile({ file }: { file: TrainerCaseFile }) {
  if (file.fileType === 2) {
    return (
      <video
        controls
        poster={file.thumbnailUrl || undefined}
        className="w-full rounded-lg border border-slate-200 bg-black"
        src={file.fileUrl}
      />
    );
  }
  return (
    <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
      <SafeImage
        src={file.fileUrl}
        fallback={DEFAULT_COURSE_COVER}
        alt={file.title || '案例图片'}
        width={1000}
        height={650}
        className="w-full h-auto object-cover"
      />
    </div>
  );
}

/**
 * 成功案例详情页 — 公开 SSR
 * <p>数据来自 GET /trainer-cases/{caseId}，仅展示已审核通过的案例。</p>
 */
export default async function TrainerCaseDetailPage({ params }: Props) {
  const { locale, id, caseId } = await params;
  setRequestLocale(locale);

  const cid = Number(caseId);
  if (isNaN(cid)) notFound();

  let detail: TrainerCase;
  try {
    detail = await getApprovedCaseDetail(cid);
  } catch {
    notFound();
  }

  const dateRange = formatDateRange(detail.trainingDate, detail.trainingEndDate);
  const region = formatRegion(detail);
  const files = detail.files || [];
  const firstImage = files.find((f) => f.fileType !== 2);
  // 封面优先用上传的封面图，其次取第一张图片附件；都没有才不展示顶部大图
  const cover = detail.coverImage?.trim() ? detail.coverImage : firstImage?.fileUrl || '';

  return (
    <div className="max-w-[1000px] mx-auto px-6 lg:px-8 py-6 space-y-6">
      <PageBreadcrumb
        items={[
          { label: '培训专家', href: '/trainers' },
          { label: detail.trainerName || '专家详情', href: `/trainers/${id}` },
          { label: detail.caseTitle || '成功案例' },
        ]}
      />

      <article className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* 封面（无封面且无图片附件时不展示，避免固定占位图） */}
        {cover && (
          <div className="aspect-[16/7] bg-slate-100 overflow-hidden">
            <SafeImage
              src={cover}
              fallback={DEFAULT_COURSE_COVER}
              alt={detail.caseTitle}
              width={1600}
              height={700}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 lg:p-8 space-y-6">
          {/* 标题 */}
          <header className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">{detail.caseTitle}</h1>
            {detail.trainerName && (
              <p className="text-sm text-slate-500">
                主讲专家：
                <Link href={`/trainers/${id}`} className="text-primary hover:underline">
                  {detail.trainerName}
                </Link>
              </p>
            )}
          </header>

          {/* 案例描述 */}
          {detail.description && detail.description.trim() && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                <h2 className="text-lg font-bold text-slate-900">案例描述</h2>
              </div>
              <p className="text-[15px] leading-7 text-slate-700 whitespace-pre-wrap">
                {detail.description}
              </p>
            </section>
          )}

          {/* 案例信息（含现场图集附件） */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <h2 className="text-lg font-bold text-slate-900">案例信息</h2>
            </div>
            <div className="rounded-lg border border-slate-200 px-4 py-2">
              <InfoRow label="客户企业" value={detail.enterpriseName} />
              <InfoRow label="所属行业" value={detail.industry} />
              <InfoRow label="培训主题" value={detail.trainingTopic} />
              <InfoRow label="关键字" value={detail.keyword} />
              <InfoRow label="培训日期" value={dateRange} />
              <InfoRow label="培训地点" value={region} />
              <InfoRow
                label="受训人数"
                value={detail.traineeCount ? `${detail.traineeCount} 人` : null}
              />
              <InfoRow label="培训效果" value={detail.trainingEffect} />
            </div>

            {/* 案例附件：图片/视频直接并入案例信息展示 */}
            {files.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {files.map((f) => (
                  <CaseFile key={f.id} file={f} />
                ))}
              </div>
            )}
          </section>
        </div>
      </article>
    </div>
  );
}
