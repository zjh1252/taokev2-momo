import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { resolveApiImageSrc } from '@/lib/media';
import { toPlainIntroText } from '@/features/trainer/utils/displayTitle';
import { SectionHeader } from './SectionHeader';
import type { Expert } from '../types';

interface ExpertsSectionProps {
  experts: Expert[];
}

/**
 * 推荐专家 — 6+3+3 混合布局
 * <p>
 * experts[0]: 左侧大卡（6列，图文并排）<br/>
 * experts[1]: 中间深色卡片（3列，圆形头像）<br/>
 * experts[2-3]: 右侧上下两张小卡（3列）
 * </p>
 */
export function ExpertsSection({ experts }: ExpertsSectionProps) {
  const t = useTranslations('home');

  const [main, middle, ...sideExperts] = experts;

  return (
    <section>
      <SectionHeader
        title={t('experts.sectionTitle')}
        viewMoreHref="/trainer"
        viewMoreText={t('experts.viewMore')}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[500px]">
        {/* 左：首席专家大卡（6 列） */}
        {main && <MainExpertCard expert={main} />}

        {/* 中：深色卡片（3 列） */}
        {middle && <MiddleExpertCard expert={middle} />}

        {/* 右：两张小卡（3 列） */}
        <div className="col-span-1 md:col-span-3 flex flex-col gap-6 h-full">
          {sideExperts.map((expert) => (
            <SideExpertCard key={expert.id} expert={expert} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** 专家封面/头像图（接口已解析，无 URL 时灰色底） */
function ExpertCoverImage({
  src,
  alt,
  className,
  fill,
  width,
  height,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
}) {
  const resolved = resolveApiImageSrc(src);
  if (!resolved) {
    if (fill) {
      return (
        <div className={`absolute inset-0 bg-slate-100 ${className ?? ''}`} aria-hidden />
      );
    }
    return (
      <div
        className={`bg-slate-100 ${className ?? ''}`}
        style={width && height ? { width, height } : undefined}
        aria-hidden
      />
    );
  }
  const fillClass = fill ? 'absolute inset-0 h-full w-full object-cover' : '';
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading="lazy"
      decoding="async"
      referrerPolicy={resolved.startsWith('http') ? 'no-referrer' : undefined}
      className={[fillClass, className].filter(Boolean).join(' ')}
    />
  );
}

/** 专家标签列表（去重后展示，key 含 index 避免重复 tag 触发 React 警告） */
function ExpertTagList({
  tags,
  limit,
  className,
  tagClassName
}: {
  tags: string[];
  limit: number;
  className?: string;
  tagClassName: string;
}) {
  if (tags.length === 0) return null;
  return (
    <div className={['flex flex-wrap gap-2', className].filter(Boolean).join(' ')}>
      {tags.slice(0, limit).map((tag, index) => (
        <span key={`${index}-${tag}`} className={tagClassName}>
          {tag}
        </span>
      ))}
    </div>
  );
}

/** 左侧首席专家大卡 */
function MainExpertCard({ expert }: { expert: Expert }) {
  return (
    <Link
      href={`/trainer/${expert.id}.htm`}
      className="col-span-1 md:col-span-6 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-100 flex flex-col md:flex-row h-full group"
    >
      <div className="md:w-[45%] h-64 md:h-full overflow-hidden relative shrink-0">
        <ExpertCoverImage
          src={expert.coverImage || expert.avatar}
          alt={expert.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-white z-10 hidden md:block" />
        {expert.badge && (
          <span className="absolute top-4 left-4 bg-primary text-white px-3 py-1 rounded text-xs font-bold tracking-widest z-20 shadow-md">
            {expert.badge}
          </span>
        )}
      </div>
      <div className="md:w-[55%] p-6 lg:p-8 flex flex-col flex-1 relative z-20">
        <h3 className="text-3xl font-black mb-2 text-slate-800 truncate">
          {expert.name}
          {expert.title && (
            <span className="text-lg font-normal text-slate-500 ml-2">
              {expert.title}
            </span>
          )}
        </h3>
        {expert.subtitle ? (
          <p className="text-primary text-sm font-bold mb-6 line-clamp-1">
            {toPlainIntroText(expert.subtitle)}
          </p>
        ) : null}
        <p className="text-slate-500 text-sm mb-8 leading-relaxed line-clamp-4">
          {toPlainIntroText(expert.bio)}
        </p>
        <div className="mt-auto flex flex-col gap-4">
          <ExpertTagList
            tags={expert.tags}
            limit={4}
            tagClassName="bg-slate-100 text-slate-600 px-3 py-1 rounded text-xs font-medium"
          />
          <span className="bg-primary text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 w-full mt-2 shadow-sm">
            查看专家详情
          </span>
        </div>
      </div>
    </Link>
  );
}

/** 中间深色卡片 */
function MiddleExpertCard({ expert }: { expert: Expert }) {
  return (
    <Link
      href={`/trainer/${expert.id}.htm`}
      className="col-span-1 md:col-span-3 bg-gradient-to-b from-slate-900 to-[#3b0a0a] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all relative flex flex-col items-center pt-10 pb-8 px-6 group text-white h-full"
    >
      <div className="w-40 h-40 rounded-full overflow-hidden mb-5 border-4 border-primary/30 shadow-inner">
        <ExpertCoverImage
          src={expert.avatar}
          alt={expert.name}
          width={160}
          height={160}
          className="w-full h-full object-cover"
        />
      </div>
      <h3 className="text-3xl font-bold mb-3 tracking-wide truncate">{expert.name}</h3>
      <p className="text-white/80 text-base text-center mb-6 leading-relaxed line-clamp-3">
        {toPlainIntroText(expert.bio)}
      </p>
      <ExpertTagList
        tags={expert.tags}
        limit={3}
        className="mb-8 justify-center"
        tagClassName="px-3 py-1 rounded text-sm text-white/90 bg-white/5 border border-white/15"
      />
      <span className="w-full py-3 rounded-lg border border-primary/50 hover:bg-primary hover:border-primary transition-colors font-medium text-sm z-10 mt-auto shadow-sm text-center">
        查看专家详情
      </span>
    </Link>
  );
}

/** 右侧小卡片 */
function SideExpertCard({ expert }: { expert: Expert }) {
  return (
    <Link
      href={`/trainer/${expert.id}.htm`}
      className="bg-white rounded-xl p-6 flex flex-col border border-slate-100 shadow-sm hover:shadow-md transition-all flex-1 group relative overflow-hidden"
    >
      <div className="flex items-start gap-5 mb-3">
        <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border border-slate-100">
          <ExpertCoverImage
            src={expert.avatar}
            alt={expert.name}
            width={80}
            height={80}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800 group-hover:text-primary transition-colors truncate">
            {expert.name}
          </h3>
          <p className="text-slate-500 text-sm mt-1 line-clamp-1">{expert.title}</p>
        </div>
      </div>
      <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-2">
        {toPlainIntroText(expert.bio)}
      </p>
      <ExpertTagList
        tags={expert.tags}
        limit={3}
        className="mt-auto gap-2"
        tagClassName="bg-slate-50 text-slate-600 px-2.5 py-1 rounded text-xs"
      />
      <span className="absolute bottom-6 right-6 text-primary hover:text-primary/80 transition-colors">
        <ArrowRight className="size-5" />
      </span>
    </Link>
  );
}
